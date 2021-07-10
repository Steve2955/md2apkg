import Exporter from './exporter.js';
import createTemplate from './template.js';
import sql from 'sql.js';

export { Exporter };

export default function(deckName, template) {
  return new Exporter(deckName, {
    template: createTemplate(template),
    sql
  });
}
