import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { chapterMailto } from '../../contact.js';
import { advisor, officerTeam, socials } from '../../constants/index.js';

const Contact = () => {
	useGSAP(() => {
		gsap.from('#contact .contact-card, #contact .officer-card', {
			opacity: 0,
			y: 28,
			duration: 0.7,
			ease: 'power2.out',
			stagger: 0.05,
			scrollTrigger: {
				trigger: '#contact',
				start: 'top 70%',
			},
		});
	});

	return (
		<footer id="contact" className="section contact-section">
			<div className="section-kicker">
				<span>05</span>
				<p>reach out</p>
			</div>

			<div className="section-header">
				<h2>Join, ask questions, or follow what the chapter is doing.</h2>
			</div>

			<div className="contact-grid">
				<article className="contact-card">
					<h3>Chapter email</h3>
					<p>Questions go to the chapter team.</p>
					<a href={chapterMailto()}>Email the chapter team</a>
					<span>{advisor.name} is copied on each message.</span>
				</article>

				<article className="contact-card">
					<h3>Next Meeting</h3>
					<p>Date, time, and room to be announced.</p>
					<span>Members can check this page for the latest update.</span>
				</article>

				<article className="contact-card">
					<h3>Socials</h3>
					<div className="social-links">
						{socials.map((social) => (
							<a
								key={social.name}
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								{social.name}
							</a>
						))}
					</div>
				</article>
			</div>

			<div className="officer-section">
				<h3>Officer Team</h3>
				<div className="officer-grid">
					{officerTeam.map((officer) => (
						<article className="officer-card" key={`${officer.role}-${officer.name}`}>
							<p>{officer.role}</p>
							<h4>{officer.name}</h4>
						</article>
					))}
				</div>
			</div>
		</footer>
	);
};

export default Contact;
