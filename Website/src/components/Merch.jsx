import { useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import { merchItems } from '../../constants/index.js';

const Merch = () => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const currentItem = merchItems[currentIndex];

	useGSAP(() => {
		gsap.fromTo(
			'#merch .merch-image img, #merch .merch-copy > *',
			{ opacity: 0, y: 28, clipPath: 'inset(0 0 20% 0)' },
			{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'power3.out', stagger: 0.06 },
		);
	}, [currentIndex]);

	const goToSlide = (index) => {
		setCurrentIndex((index + merchItems.length) % merchItems.length);
	};

	return (
		<section id="merch" className="section merch-section noisy">
			<div className="section-kicker">
				<span>04</span>
				<p>chapter goods</p>
			</div>

			<div className="section-header">
				<h2>Chapter gear and fundraisers will go here.</h2>
				<p>
					This section is ready for merch photos, prices, order forms, and fundraiser
					announcements when the chapter finalizes them.
				</p>
			</div>

			<div className="merch-tabs" aria-label="Merch options">
				{merchItems.map((item, index) => (
					<button
						key={item.id}
						className={index === currentIndex ? 'active' : ''}
						onClick={() => goToSlide(index)}
					>
						{item.name}
					</button>
				))}
			</div>

			<article className="merch-panel">
				<div className="merch-image">
					<img src={currentItem.image} alt={currentItem.title} />
				</div>

				<div className="merch-copy">
					<p>{currentItem.name}</p>
					<h3>{currentItem.title}</h3>
					<span>{currentItem.description}</span>

					<div className="merch-controls">
						<button onClick={() => goToSlide(currentIndex - 1)}>Previous</button>
						<button onClick={() => goToSlide(currentIndex + 1)}>Next</button>
					</div>
				</div>
			</article>
		</section>
	);
};

export default Merch;
