function Message(id, to, from, text, media)
{
    this.id = id;
    this.to = to;
    this.from = from;
    this.text = text;
    this.normalizedText = normalizeText(this.text);
    this.media = media || [];
};

module.exports = Message;

Message.prototype.toString = function()
{
    var content = "";
    if(this.text)
    {
        content = `"${this.text}"`;
    }
    if(this.media && this.media.length > 0)
    {
        if(content.length > 0) content += " ";
        content += `Media(${this.media[0]})`;
    }

    return `${this.from} -> ${this.to} Content: ${content}`;
};

function normalizeText(text)
{
    return (text || "").toUpperCase().replace(/[^A-Za-z0-9]/g, "");
}