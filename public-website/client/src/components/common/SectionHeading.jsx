import Badge from './Badge';

// Shared eyebrow + title + description block used at the top of most
// Home/Programs sections. Each call-site still passes its own classes for
// the eyebrow, title and description so the existing look per section is
// preserved exactly — this only removes the repeated 3-line JSX skeleton.
const SectionHeading = ({
  eyebrow,
  eyebrowClassName = '',
  title,
  titleClassName = '',
  description,
  descriptionClassName = '',
  wrapperClassName = 'text-center max-w-3xl mx-auto mb-20',
}) => (
  <div className={wrapperClassName}>
    {eyebrow && <Badge className={eyebrowClassName}>{eyebrow}</Badge>}
    <h2 className={titleClassName}>{title}</h2>
    {description && <p className={descriptionClassName}>{description}</p>}
  </div>
);

export default SectionHeading;
