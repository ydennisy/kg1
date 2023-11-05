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
    const { data, status, statusText } = await axios.post<Node[]>(
      `${BASE_URL}/nodes`,
      {
        raw,
      },
    );
    if (status === 200) {
      console.log(`✅ ${chalk.green('Succesfully added node(s).')}`);
      console.log();
      console.table(data);
    } else {
      console.error(
        `❌ ${chalk.red('Failed to add node(s).')} | ${status} ${statusText}`,
      );
    }
  } catch (err) {
    console.error(`❌ ${chalk.red('Failed to add node(s).')} | ${String(err)}`);
  }
};

export { add };
