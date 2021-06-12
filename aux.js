export function text(ctx, str, x, y, { font = '16px Times New Roman', spacing = 6 }, ...colors)
{
	const [ BOLD_CHAR, ITALIC_CHAR, COLOR_CHAR ] = [ '*', '_', '\r' ];
	const {
		textAlign: oldAlign,
		textBaseline: oldBaseline,
		font: oldFont,
		fillStyle: oldFill,
	} = ctx;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	
	let currColor = 0;
	ctx.fillStyle = colors[currColor];
	let charX = 0, charY = 0;
	const lines = str.split('\n');
	function getHeight(line)
	{
		const metrics = ctx.measureText(line);
		return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
	}
	// Keep this out of the loop! Both for performance, and to allow styled text to span multiple lines:
	const lineWidth = (() =>
	{
		let bold = false;
		let italic = false;
		return (acc, curr) =>
		{
			switch (curr)
			{
				case BOLD_CHAR:
					bold = !bold;
					return acc;
				case ITALIC_CHAR:
					italic = !italic;
					return acc;
				case COLOR_CHAR:
					return acc;
				default:
					ctx.font = getFont(bold, italic);
					return acc + ctx.measureText(curr).width;
			}
		};
	})();
	const totalHeight = lines.reduce((acc, curr) =>
		acc + getHeight(curr) + spacing, 0);
	let bold = false;
	let italic = false;
	const getFont = (bold, italic) =>
	{
		let result = '';
		if (bold)
		{
			result += 'bold ';
			if (italic)
			{
				result += 'italic ';
			}
		}
		else if (italic)
		{
			result += 'italic ';
		}
		result += font;
		return result;
	};
	for (let i = 0; i < lines.length; ++i)
	{
		const totalWidth = [...lines[i]].reduce(lineWidth, 0);
		for (let j = 0; j < lines[i].length; ++j)
		{
			const ch = lines[i].charAt(j);
			switch (ch)
			{
				case COLOR_CHAR:
					currColor = (currColor + 1) % colors.length;
					ctx.fillStyle = colors[currColor];
					continue;
				case BOLD_CHAR:
					bold = !bold;
					continue
				case ITALIC_CHAR:
					italic = !italic;
					continue;
			}
			let px = charX, py = charY;
			switch (oldAlign)
			{
				case 'left':
				case 'start': // TODO: RTL support.
					px = x + charX;
					break;
				case 'right':
				case 'end':
					px = x - totalWidth + charX;
					break;
				case 'center':
					px = x + charX - totalWidth / 2;
					break;
			}
			switch (oldBaseline)
			{
				case 'top':
					py = y + charY;
					break;
				case 'bottom':
					py = y - totalHeight + charY;
					break;
				case 'middle':
					py = y + charY +- totalHeight / 2;
					break;
			}
			ctx.font = getFont(bold, italic);
			ctx.fillText(ch, px, py);
			charX += ctx.measureText(ch).width;
		}
		charY += getHeight(lines[i]) + spacing;
		charX = 0;
	}
	// Faster than save/restore:
	ctx.textAlign = oldAlign;
	ctx.textBaseline = oldBaseline;
	ctx.fillStyle = oldFill;
	ctx.font = oldFont;
}
export const Timer = () =>
{
	let last = 0;
	let frame = 0;
	return {
		get tick()
		{
			return frame;
		},
		update(time = 0)
		{
			frame = time - last;
			last = time;
		}
	};
};