import axios from 'axios';
import chalk from 'chalk';

interface Node {
  id: string;
  title: string;
  type: 'NOTE' | 'WEB_PAGE' | 'PAPER';
}

const BASE_URL =
  process.env.BASE_URL || 'https://kg1-backend-j5dxapaafq-ew.a.run.app';

const add = async (raw: string): Promise<void> => {
  try {
    const { data } = await axios.post<Node[]>(`${BASE_URL}/nodes`, {
      raw,
    });
    const nodes = data.reduce((acc, { id, ...x }) => {
      acc[id] = x;
      return acc;
    }, {} as Record<string, object>);

    console.log(`✅ ${chalk.green('Succesfully added node(s).')}`);
    console.log();
    console.table(nodes);
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
