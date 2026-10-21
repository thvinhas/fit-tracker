const pluralRules = new Intl.PluralRules("pt-BR");

export const pluralize = (count, singular, plural) =>
  pluralRules.select(count) === "one" ? singular : plural;
