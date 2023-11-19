import axios from 'axios';
import chalk from 'chalk';

const BASE_URL = process.env.BASE_URL;

const chat = async (query: string) => {
  try {
    const { data } = await axios.request({
      method: 'get',
      url: `${BASE_URL}/chat?q=${query}`,
      responseType: 'stream',
    });
    let isFirstDataEvent = true;
    data.on('data', (data: any) => {
      if (isFirstDataEvent) {
        process.stdout.write('🤖 ' + data.toString());
        isFirstDataEvent = false;
      } else {
        process.stdout.write(data.toString());
      }
    });

    data.on('error', (err: any) => {
      console.log();
      console.log('ERROR: ', err);
    });

    data.on('end', () => {
      console.log();
    });
  } catch (err: any) {
    if (err.response && err.response.status === 429) {
      let errorMessage = '';
      err.response.data.setEncoding('utf8');
      err.response.data
        .on('data', (data: any) => {
          errorMessage += data.toString();
        })
        .on('end', () => {
          const error = JSON.parse(errorMessage);
          console.error(
            `❌ ${chalk.red('Failed to add node(s).')} | ${
              err.response.status
            } | ${error.message}`,
          );
        });
      return;
    } else {
      console.log('An unknown error has occured.');
    }
  }
};

export { chat };
