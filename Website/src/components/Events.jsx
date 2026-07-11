import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { chapterPhotos, upcomingEvents } from '../../constants/index.js';

const Events = () => {
	useGSAP(() => {
		gsap.from('#events .event-card', {
			opacity: 0,
			y: 32,
			duration: 0.75,
			ease: 'power2.out',
			stagger: 0.1,
			scrollTrigger: {
				trigger: '#events',
				start: 'top 70%',
			},
		});
	});

	return (
		<section id="events" className="section events-section noisy">
			<div className="section-kicker">
				<span>02</span>
				<p>chapter signal</p>
			</div>

			<div className="section-header">
				<h2>Member updates live here.</h2>
				<p>
					This section is built for quick updates: meeting announcements, competition
					deadlines, fundraiser dates, and chapter reminders.
				</p>
			</div>

			<div className="events-layout">
				<img src={chapterPhotos[3]} alt="PHS DECA table at a school event" />

				<div className="event-list">
					{upcomingEvents.map((event, index) => (
						<article className="event-card" key={event.name}>
							<small>{String(index + 1).padStart(2, '0')}</small>
							<p>{event.date}</p>
							<h3>{event.name}</h3>
							<span>{event.detail}</span>
						</article>
					))}
				</div>
			</div>
		</section>
	);
};

export default Events;
