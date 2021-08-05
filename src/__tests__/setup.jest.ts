import 'module-alias/register';
import { IhubFramework } from 'ihub-framework-ts';

beforeAll(async () => {
  await new IhubFramework().start();
});

afterAll(() => {
  if (!process.argv.find(arg => arg === '--watch')) {
    setTimeout(() => {
      process.kill(process.pid, 'SIGTERM');
      process.kill(process.pid, 'SIGINT');
    }, 5000);
  }
});
