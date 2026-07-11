import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { chapterBenefits, chapterPhotos, competitionTracks } from '../../constants/index.js';

const Competitions = () => {
	useGSAP(() => {
		gsap.from('#competitions .competition-card, #competitions .benefit-list li', {
			opacity: 0,
			y: 28,
			duration: 0.7,
			ease: 'power2.out',
			stagger: 0.06,
			scrollTrigger: {
				trigger: '#competitions',
				start: 'top 70%',
			},
		});
	});

	return (
		<section id="competitions" className="section competitions-section">
			<div className="section-kicker">
				<span>03</span>
				<p>competition tracks</p>
			</div>

			<div className="section-header">
				<h2>Choose a track, practice the pitch, and compete.</h2>
				<p>
					DECA events challenge members to solve business problems, present ideas,
					and think on their feet in front of judges.
				</p>
			</div>

			<div className="competition-layout">
				<div className="competition-grid">
					{competitionTracks.map((track, index) => (
						<article className="competition-card" key={track}>
							<small>{String(index + 1).padStart(2, '0')}</small>
							<h3>{track}</h3>
							<p>Explore role-plays, case studies, prepared events, and project-based competition.</p>
						</article>
					))}
				</div>

				<div className="competition-feature">
					<img src={chapterPhotos[4]} alt="DECA students celebrating an award" />
					<ul className="benefit-list">
						{chapterBenefits.map((benefit) => (
							<li key={benefit}>
								<img src="/images/check.png" alt="" />
								<span>{benefit}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
};

export default Competitions;
