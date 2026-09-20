import { useEffect } from 'react';
import Particles from './components/Particles/Particles';
import AccordionGallery from './components/AccordionGallery/AccordionGallery';
import './TeamPage.css';

const teamItems = [
  {
    image: '/team/member-1.jpeg',
    label: 'Deepanshu Kaushik',
    role: 'Frontend Developer'
  },
  {
    image: '/team/member-2.jpeg',
    label: 'Tripti Jain',
    role: 'Designer'
  },
  {
    image: '/team/member-3.jpeg',
    label: 'Chetan Arora',
    role: 'Backend Developer'
  }
];

export default function TeamPage() {
  useEffect(() => {
    document.title = 'Team';
  }, []);

  const goBackToOptions = () => {
    window.history.pushState({}, '', '/options');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main className="team-page">
      <div className="team-bg" aria-hidden="true">
        <Particles
          particleColors={['#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      <button className="team-back-button" type="button" aria-label="Back to options" onClick={goBackToOptions}>
        <span aria-hidden="true">&larr;</span>
      </button>

      <section className="team-shell" aria-label="Team">
        <header className="team-header">
          <p>Team</p>
        </header>

        <div className="team-gallery-stage">
          <AccordionGallery
            items={teamItems}
            defaultIndex={1}
            expandRatio={0.52}
            trigger="hover"
            height={430}
            gap={8}
            radius={28}
            showLabels={true}
            grayscale={true}
          />
        </div>
      </section>
    </main>
  );
}
