import axios from 'axios';
import chalk from 'chalk';

const BASE_URL = process.env.BASE_URL;

const search = async (q: string): Promise<void> => {
  try {
    const { data } = await axios.get(`${BASE_URL}/search`, {
      params: {
        q,
      },
    });
    console.log(`✅ ${chalk.green(`Succesfully searched for: "${q}"`)}`);
    console.log();
    console.table(data);
  } catch (err: any) {
    if (err.response && err.response.status === 429) {
      console.error(
        `❌ ${chalk.red('Failed to add node(s).')} | ${err.response.status} | ${
          err.response.data.message
        }`,
      );
    }
  }
};

export { search };
