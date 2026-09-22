export const chapterEmailRecipients = [
  { name: 'Avery Sussino', email: 'amsussino27@pthsd.net' },
  { name: 'Ryan Cobeo', email: 'rcobeo27@pthsd.net' },
  { name: 'Abdalrahman Aboualmaged', email: 'asaboualmaged27@pthsd.net' },
  { name: 'Nitin Venkatiahgari', email: 'nvenkatiahgari27@pthsd.net' },
  { name: 'Ryan Rigor', email: 'rarigor27@pthsd.net' },
  { name: 'Siddharth Narayana', email: 'snarayana27@pthsd.net' },
];

export const chapterAdvisor = {
  name: 'Ahmed Kandil',
  email: 'akandil@pthsd.net',
};

const chapterEmailTo = chapterEmailRecipients.map(({ email }) => email).join(',');

export const chapterMailto = (subject = '') => {
  const query = [`cc=${encodeURIComponent(chapterAdvisor.email)}`];
  if (subject) query.push(`subject=${encodeURIComponent(subject)}`);
  return `mailto:${chapterEmailTo}?${query.join('&')}`;
};
