import axios from 'axios';
import chalk from 'chalk';

interface Node {
  id: number;
  title: string;
  type: 'NOTE' | 'WEB_PAGE';
}

const BASE_URL = process.env.BASE_URL;

const add = async (raw: string): Promise<void> => {
  try {
    const { data } = await axios.post<Node[]>(`${BASE_URL}/nodes`, {
      raw,
    });

    console.log(`✅ ${chalk.green('Succesfully added node(s).')}`);
    console.log();
    console.table(data);
  } catch (err: any) {
    if (err.response && err.response.status) {
      console.error(
        `❌ ${chalk.red('Failed to add node(s).')} | ${err.response.status} | ${
          err.response.data.message
        }`,
      );
    } else {
      console.error(
        `❌ ${chalk.red('Failed to add node(s).')} | ${String(err)}`,
      );
    }
  }
};

export { add };
