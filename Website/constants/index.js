const navLinks = [
	{ id: 'home', title: 'Home' },
	{ id: 'about', title: 'About' },
	{ id: 'events', title: 'Events' },
	{ id: 'competitions', title: 'Competitions' },
	{ id: 'merch', title: 'Merch' },
	{ id: 'contact', title: 'Contact' },
];

const chapterPhotos = [
	'/images/IMG_3577.jpeg',
	'/images/IMG_0465.jpeg',
	'/images/IMG_3690.jpeg',
	'/images/unnamed.jpg',
	'/images/image (5).png',
	'/images/IMG_5827.JPG',
];

const chapterStats = [
	{ value: '6', label: 'career clusters' },
	{ value: '10', label: 'student officers' },
	{ value: '1', label: 'chapter team' },
];

const upcomingEvents = [
	{
		name: 'Next Chapter Meeting',
		date: 'Date to be announced',
		detail: 'Meeting time and room will be posted here for members.',
	},
	{
		name: 'Upcoming Competition Deadline',
		date: 'Coming soon',
		detail: 'Check back for registration, testing, and conference updates.',
	},
	{
		name: 'Fundraiser or Social Event',
		date: 'Coming soon',
		detail: 'Future chapter events and fundraisers will appear here.',
	},
];

const competitionTracks = [
	'Marketing',
	'Finance',
	'Hospitality and Tourism',
	'Business Management',
	'Entrepreneurship',
	'Personal Financial Literacy',
];

const chapterBenefits = [
	'Practice real business scenarios',
	'Build presentation confidence',
	'Compete at regional and state events',
	'Lead chapter projects and fundraisers',
];

const merchItems = [
	{
		id: 1,
		name: 'Chapter Tee',
		image: '/images/logo.png',
		title: 'PHS DECA Spirit Wear',
		description: 'A simple chapter shirt placeholder for future merch drops, pricing, and order links.',
	},
	{
		id: 2,
		name: 'Hoodie',
		image: '/images/unnamed.jpg',
		title: 'Competition-Ready Merch',
		description: 'Use this spot for hoodie mockups, order windows, and pickup details once available.',
	},
	{
		id: 3,
		name: 'Accessories',
		image: '/images/IMG_0465.jpeg',
		title: 'Member Gear',
		description: 'Add lanyards, stickers, or fundraiser items here as the chapter finalizes designs.',
	},
];

const officerTeam = [
	{ role: 'Co-President', name: 'Avery Sussino' },
	{ role: 'Co-President', name: 'Ryan Rigor' },
	{ role: 'V.P. of Operations', name: 'Abdalrahman Aboualmaged' },
	{ role: 'V.P. of Finance', name: 'Nitin Venkatiaghari' },
	{ role: 'V.P. of Media', name: 'Siddharth Narayana' },
	{ role: 'V.P. of Membership', name: 'Ryan Cobeo' },
	{ role: 'Operations Officer', name: 'Griffin Weiss' },
	{ role: 'Financial Officer', name: 'Riya Nair' },
	{ role: 'Publicity Officer', name: 'Tanish Samal' },
	{ role: 'Membership Coordinator', name: 'Jayden Gomez' },
];

const advisor = {
	name: 'Ahmed Kandil',
	email: 'akandil@pthsd.net',
};

const socials = [
	{
		name: 'Instagram',
		url: 'https://www.instagram.com/parhighdeca/?hl=en',
	},
	{
		name: 'TikTok',
		url: 'https://www.tiktok.com/@parhighdeca',
	},
];

export {
	advisor,
	chapterBenefits,
	chapterPhotos,
	chapterStats,
	competitionTracks,
	merchItems,
	navLinks,
	officerTeam,
	socials,
	upcomingEvents,
};
