const REPLICATE_API_BASE = 'https://api.replicate.com/v1';
const REPLICATE_MODEL = 'qwen/qwen-image-layered';
const DEFAULT_LAYER_COUNT = 4;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const image = typeof body.image === 'string' ? body.image : '';
    const numLayers = clampLayerCount(body.num_layers);

    if (!image) {
      return jsonResponse(400, { error: 'Missing image payload' });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return jsonResponse(500, {
        error: 'Missing REPLICATE_API_TOKEN environment variable',
        provider: 'replicate',
      });
    }

    const prediction = await createReplicatePrediction({
      token,
      image,
      numLayers,
    });

    const completed = await pollPrediction({
      token,
      statusUrl: prediction.urls?.get,
    });

    const layers = normalizeReplicateOutput(completed.output);
    if (layers.length === 0) {
      return jsonResponse(502, {
        error: 'Replicate returned no layers',
        provider: 'replicate',
      });
    }

    return jsonResponse(200, {
      layers,
      mocked: false,
      provider: 'replicate',
    });
  } catch (error) {
    console.error('explode-image error', error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Unexpected explode-image failure',
    });
  }
};

function clampLayerCount(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_LAYER_COUNT;
  return Math.min(8, Math.max(2, Math.round(value)));
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

async function createReplicatePrediction({ token, image, numLayers }) {
  const response = await fetch(`${REPLICATE_API_BASE}/models/${REPLICATE_MODEL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        image,
        num_layers: numLayers,
        output_format: 'png',
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.detail || payload?.error || 'Failed to create Replicate prediction');
  }

  return payload;
}

async function pollPrediction({ token, statusUrl }) {
  if (!statusUrl) {
    throw new Error('Missing Replicate status URL');
  }

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(statusUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.detail || payload?.error || 'Failed to poll Replicate prediction');
    }

    if (payload.status === 'succeeded') {
      return payload;
    }

    if (payload.status === 'failed' || payload.status === 'canceled') {
      throw new Error(payload?.error || `Prediction ${payload.status}`);
    }

    await wait(1500);
  }

  throw new Error('Timed out waiting for Replicate prediction');
}

function normalizeReplicateOutput(output) {
  if (Array.isArray(output)) {
    return output.filter((value) => typeof value === 'string');
  }

  if (output && typeof output === 'object') {
    if (Array.isArray(output.layers)) {
      return output.layers.filter((value) => typeof value === 'string');
    }

    if (Array.isArray(output.images)) {
      return output.images.filter((value) => typeof value === 'string');
    }
  }

  return [];
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
