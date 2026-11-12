// Hvor lenge (sekunder) nettleseren kan vise en side den har hentet på forhånd
// før den spør serveren på nytt. Egne endringer tømmer minnet med en gang;
// dette gjelder bare endringer andre beboere gjør. Må være minst 30 for at
// forhåndshenting av sider skal fungere.
export const CLIENT_STALE_SECONDS = 60;
