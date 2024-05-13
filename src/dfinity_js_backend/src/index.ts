import { query, update, text, Record, StableBTreeMap, Variant, Vec, None, Some, Ok, Err, ic, Principal, Opt, nat64, Duration, Result, bool, Canister } from "azle";
import {
    Ledger, binaryAddressFromAddress, binaryAddressFromPrincipal, hexAddressFromPrincipal
} from "azle/canisters/ledger";
import { hashCode } from "hashcode";
import { v4 as uuidv4 } from "uuid";

const Taxonomy = Record({
    id: text,
    kingdom: text,
    phylum: text,
    taxon_class: text,
    order: text,
    family: text,
    genus: text,
    species: text,
    created_at: text,
    updated_at: text,
});

const MarineSpecie = Record({
    id: text,
    taxonomy: Taxonomy,
    name: text,
    description: text,
    created_at: text,
    updated_at: text,
});


const TaxonomyPayload = Record({
    kingdom: text,
    phylum: text,
    taxon_class: text,
    order: text,
    family: text,
    genus: text,
    species: text,
});

const MarineSpeciePayload = Record({
    name: text,
    description: text,
});

const Message = Variant({
    NotFound: text,
    InvalidPayload: text,
    PaymentFailed: text,
    PaymentCompleted: text
});


const taxonomyStorage = StableBTreeMap(0, text, Taxonomy);
const marineSpecieStorage = StableBTreeMap(1, text, MarineSpecie);

const icpCanister = Ledger(Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"));


export default Canister({
    getTaxonomies: query([], Vec(Taxonomy), () => {
        return taxonomyStorage.values();
    }),

    getTaxonomy: query([text], Result(Taxonomy, Message), (id) => {
        const taxonomyOpt = taxonomyStorage.get(id);
        if ("None" in taxonomyOpt) {
            return Err({ NotFound: `taxonomy with id=${id} not found` });
        }
        return Ok(taxonomyOpt.Some);
    }),

    addTaxonomy: update([TaxonomyPayload], Result(Taxonomy, Message), (payload) => {
        if (typeof payload !== "object" || Object.keys(payload).length === 0) {
            return Err({ InvalidPayload: "invalid payoad" })
        }
        const taxonomy = { id: uuidv4(), ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        taxonomyStorage.insert(taxonomy.id, taxonomy);
        return Ok(taxonomy);
    }),

    // Update using taxonomy id and TaxonomyPayload of the taxonomy
    updateTaxonomy: update([text, TaxonomyPayload], Result(Taxonomy, Message), (id, payload) => {
        const taxonomyOpt = taxonomyStorage.get(id);
        if ("None" in taxonomyOpt) {
            return Err({ NotFound: `cannot update the taxonomy: taxonomy with id=${id} not found` });
        }
        taxonomyStorage.insert(taxonomyOpt.Some.id, { ...taxonomyOpt.Some, ...payload, updated_at: new Date().toISOString() });
        return Ok(taxonomyOpt.Some);
    }),

    deleteTaxonomy: update([text], Result(Taxonomy, Message), (id) => {
        const deletedTaxonomyOpt = taxonomyStorage.get(id);
        if ("None" in deletedTaxonomyOpt) {
            return Err({ NotFound: `cannot delete the taxonomy: taxonomy with id=${id} not found` });
        }
        taxonomyStorage.remove(id);
        return Ok(deletedTaxonomyOpt.Some);
    }),

    getMarineSpecies: query([], Vec(MarineSpecie), () => {
        return marineSpecieStorage.values();
    }),

    getMarineSpecie: query([text], Result(MarineSpecie, Message), (id) => {
        const marineSpecieOpt = marineSpecieStorage.get(id);
        if ("None" in marineSpecieOpt) {
            return Err({ NotFound: `marine specie with id=${id} not found` });
        }
        return Ok(marineSpecieOpt.Some);
    }),

    addMarineSpecie: update([text, MarineSpeciePayload], Result(MarineSpecie, Message), (taxonomyId, payload) => {
        if (typeof payload !== "object" || Object.keys(payload).length === 0) {
            return Err({ InvalidPayload: "invalid payoad" })
        }
        const taxonomyOpt = taxonomyStorage.get(taxonomyId);
        if ("None" in taxonomyOpt) {
            return Err({ NotFound: `cannot add marine specie: taxonomy with id=${taxonomyId} not found` });
        }
        const marineSpecie = { id: uuidv4(), taxonomy: taxonomyOpt.Some, ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        marineSpecieStorage.insert(marineSpecie.id, marineSpecie);
        return Ok(marineSpecie);
    }
    ),
    // Update using specie id and MarineSpeciepayload of the specie
    updateMarineSpecie: update([text, MarineSpeciePayload], Result(MarineSpecie, Message), (id, payload) => {
        const marineSpecieOpt = marineSpecieStorage.get(id);
        if ("None" in marineSpecieOpt) {
            return Err({ NotFound: `cannot update the marine specie: marine specie with id=${id} not found` });
        }
        marineSpecieStorage.insert(marineSpecieOpt.Some.id, { ...marineSpecieOpt.Some, ...payload, updated_at: new Date().toISOString() });
        return Ok(marineSpecieOpt.Some);
    }),
    

    deleteMarineSpecie: update([text], Result(MarineSpecie, Message), (id) => {
        const deletedMarineSpecieOpt = marineSpecieStorage.get(id);
        if ("None" in deletedMarineSpecieOpt) {
            return Err({ NotFound: `cannot delete the marine specie: marine specie with id=${id} not found` });
        }
        marineSpecieStorage.remove(id);
        return Ok(deletedMarineSpecieOpt.Some);
    }),

    removeTaxonomyFromMarineSpecie: update([text, text], Result(MarineSpecie, Message), (marineSpecieId, taxonomyId) => {
        const marineSpecieOpt = marineSpecieStorage.get(marineSpecieId);
        if ("None" in marineSpecieOpt) {
            return Err({ NotFound: `cannot remove taxonomy from marine specie: marine specie with id=${marineSpecieId} not found` });
        }

        const taxonomyOpt = taxonomyStorage.get(taxonomyId);
        if ("None" in taxonomyOpt) {
            return Err({ NotFound: `cannot remove taxonomy from marine specie: taxonomy with id=${taxonomyId} not found` });
        }

        marineSpecieOpt.Some.taxonomy = taxonomyOpt.Some;
        marineSpecieStorage.insert(marineSpecieId, marineSpecieOpt.Some);
        return Ok(marineSpecieOpt.Some);
    } ),

    addTaxonomyToMarineSpecie: update([text, text], Result(MarineSpecie, Message), (marineSpecieId, taxonomyId) => {
        const marineSpecieOpt = marineSpecieStorage.get(marineSpecieId);
        if ("None" in marineSpecieOpt) {
            return Err({ NotFound: `cannot add taxonomy to marine specie: marine specie with id=${marineSpecieId} not found` });
        }

        const taxonomyOpt = taxonomyStorage.get(taxonomyId);
        if ("None" in taxonomyOpt) {
            return Err({ NotFound: `cannot add taxonomy to marine specie: taxonomy with id=${taxonomyId} not found` });
        }

        marineSpecieOpt.Some.taxonomy = taxonomyOpt.Some;
        marineSpecieStorage.insert(marineSpecieId, marineSpecieOpt.Some);
        return Ok(marineSpecieOpt.Some);
    }),

    // Sort Marine Species by Taxonomy Kingdom Ascending
    sortMarineSpeciesByTaxonomyKingdom: query([], Vec(MarineSpecie), () => {
        const marineSpecies = marineSpecieStorage.values();
        return marineSpecies.sort((a, b) => a.taxonomy.kingdom.localeCompare(b.taxonomy.kingdom));
    }),

    // Sort Marine Species by Taxonomy Kingdom Descending
    sortMarineSpeciesByTaxonomyKingdomDesc: query([], Vec(MarineSpecie), () => {
        const marineSpecies = marineSpecieStorage.values();
        return marineSpecies.sort((a, b) => b.taxonomy.kingdom.localeCompare(a.taxonomy.kingdom));
    }),

    // Search Marine Species by Taxonomy Kingdom or Phylum
    searchMarineSpeciesByTaxonomyKingdomOrPhylum: query([text], Vec(MarineSpecie), (searchText) => {
        const marineSpecies = marineSpecieStorage.values();
        return marineSpecies.filter((marineSpecie) => marineSpecie.taxonomy.kingdom.toLowerCase() === searchText.toLowerCase() || marineSpecie.taxonomy.phylum.toLowerCase() === searchText.toLowerCase());
    }),

    // Arrange Marine Species by Time of Creation Ascending
    sortMarineSpeciesByTimeOfCreation: query([], Vec(MarineSpecie), () => {
        const marineSpecies = marineSpecieStorage.values();
        return marineSpecies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }),



});



/*
    a hash function that is used to generate correlation ids for orders.
    also, we use that in the verifyPayment function where we check if the used has actually paid the order
*/
function hash(input: any): nat64 {
    return BigInt(Math.abs(hashCode().value(input)));
};

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};



