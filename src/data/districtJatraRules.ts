type JatraRule = {
    districtIds: string[];
    eventTitle: string;
    triggerKeywords: string[];
};

const RULES: JatraRule[] = [
    {
        districtIds: ['pune', 'solapur'],
        eventTitle: 'वारकरी पालखी सोहळा (ज्ञानेश्वर-तुकाराम)',
        triggerKeywords: ['आषाढी एकादशी', 'ashadhi ekadashi', 'devshayani', 'देवशयनी']
    },
    {
        districtIds: ['pune', 'solapur'],
        eventTitle: 'कार्तिकी वारी सोहळा',
        triggerKeywords: ['कार्तिकी एकादशी', 'kartiki ekadashi', 'prabodhini']
    },
    {
        districtIds: ['ahilyanagar'],
        eventTitle: 'शिर्डी साईबाबा उत्सव',
        triggerKeywords: ['राम नवमी', 'ram navami', 'विजयादशमी', 'दसरा', 'guru purnima', 'गुरु पोर्णिमा']
    },
    {
        districtIds: ['kolhapur'],
        eventTitle: 'अंबाबाई देवी उत्सव (स्थानिक)',
        triggerKeywords: ['नवरात्री', 'navaratri', 'दसरा', 'विजयादशमी']
    },
    {
        districtIds: ['nashik'],
        eventTitle: 'त्र्यंबकेश्वर श्रावण सोमवार यात्रा',
        triggerKeywords: ['श्रावण', 'shravan', 'सोमवार', 'monday']
    },
    {
        districtIds: ['satara', 'sangli'],
        eventTitle: 'खंडोबा जत्रा (प्रादेशिक)',
        triggerKeywords: ['चंपा षष्ठी', 'champa shashthi', 'khandoba']
    },
    {
        districtIds: ['nagpur', 'chandrapur', 'gadchiroli'],
        eventTitle: 'देवी जत्रा / नवरात्र महोत्सव (विदर्भ)',
        triggerKeywords: ['नवरात्री', 'navaratri', 'अष्टमी', 'navami']
    }
];

const unique = (items: string[]) => Array.from(new Set(items));

const containsAny = (text: string, keys: string[]) => keys.some((key) => text.includes(key.toLowerCase()));

export const getDistrictJatraEvents = (
    districtId: string,
    searchableFestivalText: string[]
) => {
    const haystack = searchableFestivalText.map((item) => item.toLowerCase());

    const matched = RULES
        .filter((rule) => rule.districtIds.includes(districtId))
        .filter((rule) => haystack.some((item) => containsAny(item, rule.triggerKeywords)))
        .map((rule) => rule.eventTitle);

    return unique(matched);
};
