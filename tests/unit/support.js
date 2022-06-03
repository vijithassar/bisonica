import { timeFormat } from '@crowdstrike/falcon-charts/components/falcon-charts/shared/helpers';

const day = () => Math.floor(Math.random() * 10);
const groups = 5;
const group = () => String.fromCharCode(Math.floor(Math.random() * groups + 97));

const datum = () => {
  const date = timeFormat(new Date(new Date().getFullYear(), 1, day()));

  return { label: date, value: Math.random(), group: group() };
};

const data = () => {
  return Array.from({ length: 100 }).map(datum);
};

const dimensions = { x: 100, y: 100 };

export { data, dimensions, groups };
