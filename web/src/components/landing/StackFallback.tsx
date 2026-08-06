/**
 * What stands in for the 3D stack.
 *
 * Used twice: while the WebGL chunk loads, and permanently for anyone who asks
 * for reduced motion. Both audiences get a real, composed illustration rather
 * than a spinner or an empty box, and because it occupies the same space as the
 * canvas there is no layout shift when the canvas takes over.
 *
 * Same four cards, same one-is-a-scam idea, built from CSS 3D transforms.
 */
export function StackFallback() {
  const cards = [
    { top: '1%', rotate: -5, translateZ: -70, scam: false, lines: [72, 50, 62] },
    { top: '24%', rotate: 3, translateZ: -30, scam: false, lines: [66, 78, 44] },
    { top: '47%', rotate: -2, translateZ: 30, scam: true, lines: [80, 58, 70, 36] },
    { top: '70%', rotate: 5, translateZ: 70, scam: false, lines: [60, 72, 50] },
  ];

  return (
    <div className="stackfall" aria-hidden="true">
      {cards.map((card, i) => (
        <div
          key={i}
          className="stackfall__card"
          data-scam={card.scam ? 'true' : undefined}
          style={{
            top: card.top,
            transform: `translateZ(${card.translateZ}px) rotate(${card.rotate}deg)`,
          }}
        >
          <span className="stackfall__rule" />
          {card.lines.map((len, j) => (
            <span key={j} className="stackfall__line" style={{ width: `${len}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}
