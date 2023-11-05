import axios from 'axios';

const BASE_URL = process.env.BASE_URL;

const search = async (q: string): Promise<void> => {
  const { data } = await axios.get(`${BASE_URL}/search`, {
    params: {
      q,
    },
  });
  console.table(data);
};

export { search };
