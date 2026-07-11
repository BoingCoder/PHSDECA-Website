import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { navLinks } from '../../constants/index.js';

const Navbar = () => {
	useGSAP(() => {
		gsap.fromTo(
			'nav',
			{ backgroundColor: 'transparent' },
			{
				backgroundColor: '#07111fd9',
				backdropFilter: 'blur(14px)',
				duration: 0.6,
				scrollTrigger: {
					trigger: 'nav',
					start: 'bottom top',
					toggleActions: 'play none none reverse',
				},
			},
		);
	});

	return (
		<nav>
			<div>
				<a href="#home" className="flex items-center gap-3">
					<img src="/images/logo.png" className="h-10 w-9 object-contain" alt="PHS DECA logo" />
					<p>PHS DECA</p>
				</a>

				<ul>
					{navLinks.map((link) => (
						<li key={link.id}>
							<a href={`#${link.id}`}>{link.title}</a>
						</li>
					))}
				</ul>
			</div>
		</nav>
	);
};

export default Navbar;
