import { useEffect, useState } from 'react';
import CircularGallery from './components/CircularGallery/CircularGallery';
import Ferrofluid from './components/Ferrofluid/Ferrofluid';
import { activityRecordToGalleryItem, getActivityUploads } from './features/activity/activityStorage';
import './PreviousActivityPage.css';

export default function PreviousActivityPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'Previous Activity';

    let isMounted = true;
    let objectUrls = [];

    const loadUploads = async () => {
      setIsLoading(true);
      const records = await getActivityUploads();
      const latestRecords = records.slice(-10);
      const firstLatestIndex = Math.max(0, records.length - latestRecords.length);
      const galleryItems = await Promise.all(
        latestRecords.map((record, index) => activityRecordToGalleryItem(record, firstLatestIndex + index))
      );
      objectUrls = galleryItems.map(item => item.objectUrl);
      if (isMounted) {
        setItems(galleryItems);
        setIsLoading(false);
      } else {
        objectUrls.forEach(URL.revokeObjectURL);
      }
    };

    loadUploads().catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      objectUrls.forEach(URL.revokeObjectURL);
    };
  }, []);

  const goBackToOptions = () => {
    window.history.pushState({}, '', '/options');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main className="previous-activity-page">
      <div className="activity-ferrofluid-bg" aria-hidden="true">
        <Ferrofluid
          colors={['#ffffff', '#ffffff', '#ffffff']}
          speed={0.5}
          scale={1}
          turbulence={1}
          fluidity={0.1}
          rimWidth={0.2}
          sharpness={3}
          shimmer={1}
          glow={2}
          flowDirection="down"
          opacity={1.0}
          mouseInteraction={true}
          mouseStrength={1}
          mouseRadius={0.3}
        />
      </div>
      <button className="activity-back-button" type="button" aria-label="Back to options" onClick={goBackToOptions}>
        <span aria-hidden="true">←</span>
      </button>

      <section className="activity-shell" aria-label="Previous activity">
        <header className="activity-header">
          <p>Previous Activity</p>
        </header>

        <div className="activity-gallery-wrap">
          {isLoading ? (
            <div className="activity-empty">Loading activity...</div>
          ) : items.length ? (
            <CircularGallery
              items={items}
              bend={items.length === 1 ? 0 : 3}
              borderRadius={0.05}
              textColor="#ffffff"
              font="bold 34px Arial"
              scrollSpeed={2}
              scrollEase={0.02}
              repeatItems={false}
              itemScale={0.5}
              labelGap={0.035}
              labelScale={0.24}
            />
          ) : (
            <div className="activity-empty">No checked uploads yet</div>
          )}
        </div>
      </section>
    </main>
  );
}
