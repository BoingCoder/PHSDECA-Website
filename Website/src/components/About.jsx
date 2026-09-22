import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { chapterPhotos, chapterStats } from '../../constants/index.js';

const About = () => {
	useGSAP(() => {
		gsap.from('#about .reveal', {
			opacity: 0,
			y: 36,
			duration: 0.8,
			ease: 'power2.out',
			stagger: 0.08,
			scrollTrigger: {
				trigger: '#about',
				start: 'top 70%',
			},
		});
	});

	return (
		<section id="about" className="section about-section">
			<div className="section-kicker reveal">
				<span>01</span>
				<p>meet phs deca</p>
			</div>

			<div className="section-header reveal">
				<h2>Business skills, competition energy, and a team that shows up.</h2>
				<p>
					Parsippany High School DECA gives students a place to practice leadership,
					presentation, finance, marketing, hospitality, and entrepreneurship skills
					before they step into competition rooms and real careers.
				</p>
			</div>

			<div className="stat-row reveal">
				{chapterStats.map((stat, index) => (
					<div key={stat.label}>
						<small>{String(index + 1).padStart(2, '0')}</small>
						<strong>{stat.value}</strong>
						<span>{stat.label}</span>
					</div>
				))}
			</div>

			<div className="photo-grid reveal">
				<img className="wide" src={chapterPhotos[3]} alt="PHS DECA members preparing for competition" />
				<img src={chapterPhotos[4]} alt="PHS DECA members on a conference stage" />
				<img src={chapterPhotos[5]} alt="PHS DECA chapter portrait" />
			</div>
		</section>
	);
};

export default About;
