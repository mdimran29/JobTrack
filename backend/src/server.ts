import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`JobTrack API listening on http://localhost:${env.PORT}`);
});
