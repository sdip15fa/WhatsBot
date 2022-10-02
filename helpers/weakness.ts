import { Dex } from "pokemon-showdown";

export function weakness(target: string) {
  let species = Dex.species.get(target);
  const type1 = Dex.types.get(species.types[0]);
  const type2 = Dex.types.get(species.types[1]);
  const type3 = Dex.types.get(species.types[2]);

  if (species.exists) {
    target = species.name;
  } else {
    const types = [];
    if (type1.exists) {
      types.push(type1.name);
      if (type2.exists && type2 !== type1) {
        types.push(type2.name);
      }
      if (type3.exists && type3 !== type1 && type3 !== type2) {
        types.push(type3.name);
      }
    }

    if (types.length === 0) {
      return `${target} isn't a recognized type or Pokemon${
        Dex.gen > Dex.gen ? ` in Gen ${Dex.gen}` : ""
      }.`;
    }
  }

  const weaknesses = [];
  const resistances = [];
  const immunities = [];
  for (const type of Dex.types.names()) {
    const notImmune = Dex.getImmunity(type, species);
    if (notImmune) {
      let typeMod = !notImmune ? 1 : 0;
      typeMod += Dex.getEffectiveness(type, species);
      switch (typeMod) {
        case 1:
          weaknesses.push(type);
          break;
        case 2:
          weaknesses.push(type);
          break;
        case 3:
          weaknesses.push(type);
          break;
        case -1:
          resistances.push(type);
          break;
        case -2:
          resistances.push(type);
          break;
        case -3:
          resistances.push(type);
          break;
      }
    } else {
      immunities.push(type);
    }
  }

  return `
Weaknesses:
${weaknesses.join("\n")}

Resistances:
${resistances.join("\n")}

Immunities:
${immunities.join("\n")}
  `
}
