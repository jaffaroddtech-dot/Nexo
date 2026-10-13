import React from "react";

// Apple emoji images (emoji-datasource-apple, jsDelivr CDN)
const CDN =
    "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/";

// emoji sequence ko filename mein badalta hai: "1f600" ya "1f468-200d-1f469-..."
const toFileName = (emoji) =>
    Array.from(emoji)
        .map((c) => c.codePointAt(0).toString(16))
        .filter((cp) => cp !== "fe0f") // variation selector hata do
        .join("-");

// emoji (ZWJ sequences, skin tones, flags, keycaps sab) pakadne wali regex
const EMOJI_REGEX =
    /(?:\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*)/gu;

const EmojiText = ({ text }) => {
    if (!text) return null;

    const parts = [];
    let last = 0;
    let match;
    EMOJI_REGEX.lastIndex = 0;

    while ((match = EMOJI_REGEX.exec(text)) !== null) {
        if (match.index > last) parts.push(text.slice(last, match.index));

        const emoji = match[0];
        parts.push(
            <img
                key={`${match.index}-${emoji}`}
                className="apple-emoji"
                src={`${CDN}${toFileName(emoji)}.png`}
                alt={emoji}
                draggable={false}
                loading="lazy"
                // image na mile to native emoji dikha do
                onError={(e) => {
                    e.currentTarget.replaceWith(document.createTextNode(emoji));
                }}
            />
        );
        last = match.index + emoji.length;
    }

    if (last < text.length) parts.push(text.slice(last));

    return <span className="emoji-text">{parts}</span>;
};

export default EmojiText;