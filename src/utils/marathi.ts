const commonWordMap: Record<string, string> = {
    'मंगलवार': 'मंगळवार',
    'अमावस्या': 'अमावास्या',
    'कृष्णा': 'कृष्ण',
    'महारष्ट्र': 'महाराष्ट्र',
    'बुधवार': 'बुधवार',
    'शुक्रवार': 'शुक्रवार',
    'शनि': 'शनि',
    'सूर्यवार': 'रविवार',
    'जनमाष्टमी': 'जन्माष्टमी',
    'शिवरात्री': 'शिवरात्री'
};

export const normalizeMarathi = (input: string) => {
    let text = input.trim();

    Object.entries(commonWordMap).forEach(([source, target]) => {
        text = text.replaceAll(source, target);
    });

    return text;
};

export const isUpwasText = (festivalName: string) => {
    const keywords = ['एकादशी', 'चतुर्थी', 'प्रदोष', 'व्रत', 'उपवास', 'शिवरात्री', 'अमावास्या', 'पोर्णिमा'];
    return keywords.some((item) => festivalName.includes(item));
};

export const marathiFieldLabel: Record<string, string> = {
    tithi: 'तिथी',
    nakshatra: 'नक्षत्र',
    yoga: 'योग',
    karana: 'करण',
    vara: 'वार'
};
