/** Fixed homepage watermark — light/dark images swapped via CSS in globals.css */
export function HomeWatermarkBackground() {
  return (
    <div aria-hidden="true" className="home-watermark">
      <div className="home-watermark__layer home-watermark__layer--light" />
      <div className="home-watermark__layer home-watermark__layer--dark" />
    </div>
  );
}
