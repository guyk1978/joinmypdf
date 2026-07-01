export type InfoProseSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

type InfoProseDocumentProps = {
  sections: InfoProseSection[];
};

export function InfoProseDocument({ sections }: InfoProseDocumentProps) {
  return (
    <article className="info-prose-document">
      {sections.map((section) => (
        <section key={section.id} className="info-prose-document__section" aria-labelledby={section.id}>
          <h2 id={section.id} className="info-prose-document__heading">
            {section.title}
          </h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className="info-prose-document__paragraph">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
