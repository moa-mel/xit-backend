import Mux from '@mux/mux-node';

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

async function initializeMux() {
  await mux.video.liveStreams.create({
    playback_policy: ['public'],
    new_asset_settings: { playback_policy: ['public'] },
  });
}

initializeMux();