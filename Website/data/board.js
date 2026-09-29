// Update each member's bio and awards here as the chapter confirms them.
// Portraits come from the PHS DECA 2026–27 executive board announcement:
// https://www.instagram.com/parhighdeca/p/Dc2epXXDgBX/
export const boardMembers = [
  { name: 'Avery Sussino', role: 'Co-President', photo: 'avery-sussino.webp', bio: '', awards: [] },
  { name: 'Ryan Rigor', role: 'Co-President', photo: 'ryan-rigor.webp', bio: '', awards: [] },
  { name: 'Abdalrahman Aboualmaged', role: 'V.P. of Operations', photo: 'abdalrahman-aboualmaged.webp', bio: '', awards: [] },
  { name: 'Nitin Venkatiahgari', role: 'V.P. of Finance', photo: 'nitin-venkatiahgari.webp', bio: '', awards: [] },
  { name: 'Siddharth Narayana', role: 'V.P. of Media', photo: 'siddharth-narayana.webp', bio: '', awards: [] },
  { name: 'Ryan Cobeo', role: 'V.P. of Membership', photo: 'ryan-cobeo.webp', bio: '', awards: [] },
  { name: 'Griffin Weiss', role: 'Operations Officer', photo: 'griffin-weiss.webp', bio: '', awards: [] },
  { name: 'Riya Nair', role: 'Financial Officer', photo: 'riya-nair.webp', bio: '', awards: [] },
  { name: 'Tanish Samal', role: 'Publicity Officer', photo: 'tanish-samal.webp', bio: '', awards: [] },
  { name: 'Jayden Gomez', role: 'Membership Coordinator', photo: 'jayden-gomez.webp', bio: '', awards: [] },
];

const textElement = (tag, className, text) => {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
};

export const renderBoard = () => {
  const grid = document.querySelector('[data-board-grid]');
  if (!grid) return;

  const cards = boardMembers.map((member) => {
    const card = document.createElement('article');
    card.className = 'board-card';

    const portrait = document.createElement('div');
    portrait.className = 'board-card__portrait';
    const image = document.createElement('img');
    image.src = `./images/board/${member.photo}`;
    image.alt = `Portrait of ${member.name}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 606;
    image.height = 606;
    portrait.append(image);

    const content = document.createElement('div');
    content.className = 'board-card__content';
    content.append(
      textElement('p', 'board-card__role', member.role),
      textElement('h3', 'board-card__name', member.name),
    );

    const bio = document.createElement('div');
    bio.className = 'board-card__detail';
    bio.append(
      textElement('h4', '', 'Bio'),
      textElement('p', member.bio ? '' : 'board-card__pending', member.bio || 'Bio coming soon.'),
    );

    const awards = document.createElement('div');
    awards.className = 'board-card__detail board-card__detail--awards';
    awards.append(textElement('h4', '', 'Awards'));
    if (member.awards.length) {
      const list = document.createElement('ul');
      member.awards.forEach((award) => list.append(textElement('li', '', award)));
      awards.append(list);
    } else {
      awards.append(textElement('p', 'board-card__pending', 'Awards to be added.'));
    }

    content.append(bio, awards);
    card.append(portrait, content);
    return card;
  });

  grid.replaceChildren(...cards);
};
