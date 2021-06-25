'use strict';
// Un juego de Snake básico, by K. Russell Smith
import { Timer, text } from './aux.js';

const Dir = {
	LEFT:   [-1, +0],
	RIGHT:  [+1, +0],
	UP:     [+0, -1],
	DOWN:   [+0, +1],
};
Dir.inverse = (() => ((...pairs) =>
	{
		const result = {};
		for (const pair of pairs)
		{
			result[pair[0]] = pair[1];
			result[pair[1]] = pair[0];
		}
		return result;
	})(
		[Dir.LEFT, Dir.RIGHT],
		[Dir.UP,   Dir.DOWN]))();

class Snake
{
	constructor(x, y)
	{
		this.dir = Dir.RIGHT;
		this.nodes = [[x, y]];
	}
	grow()
	{
		this.nodes.unshift([this.head[0] + this.dir[0], this.head[1] + this.dir[1]]);
	}
	move()
	{
		for (let i = this.nodes.length - 1; i >= 1; --i)
		{
			this.nodes[i][0] = this.nodes[i - 1][0];
			this.nodes[i][1] = this.nodes[i - 1][1];
		}
		this.head[0] += this.dir[0];
		this.head[1] += this.dir[1];
	}
	turn(dir)
	{
		if (this.nodes.length === 1 || dir !== Dir.inverse[this.dir])
		{
			this.dir = dir;
		}
	}
	get bitSelf()
	{
		for (let i = this.nodes.length - 1; i >= 1; --i)
		{
			if (this.nodes[i][0] === this.head[0] && this.nodes[i][1] === this.head[1])
			{
				return true;
			}
		}
		return false;
	}
	OOB(width, height)
	{
		const { head } = this;
		return (head[0] < 0 || head[1] < 0 || head[0] >= width || head[1] >= height);
	}
	get head()
	{
		return this.nodes[0];
	}
}

const Game = ({
	snakePos = [0, 0],
	tick     = 100,
	cellSize = 10,
	size     = 10}) =>
({
	tick,
	fish: [0, 0],
	storageKey: 'KRS-snake-score',
	init()
	{
		this.snake     = new Snake(snakePos[0], snakePos[1]),
		this.points    = 0;
		this.highScore = localStorage.getItem(this.storageKey) || 0;
		this.spawnFish();
		return this;
	},
	score(points)
	{
		this.points += points;
		if (this.points >= this.highScore)
		{
			this.highScore = this.points;
			localStorage.setItem(this.storageKey, this.highScore);
		}
	},
	update()
	{
		const { snake, fish } = this;
		if (
			snake.head[0] === fish[0] &&
			snake.head[1] === fish[1])
		{
			snake.grow();
			this.spawnFish();
			this.score(1);
		}
		else
		{
			snake.move();
		}
	},
	draw(ctx)
	{
		const { snake, fish } = this;
		const { width, height } = ctx.canvas;
		ctx.save();
		ctx.translate(
			(width - size * cellSize) / 2,
			(height - size * cellSize) / 2);
		
		for (let i = snake.nodes.length - 1; i >= 0; --i)
		{
			ctx.fillStyle = snake.nodes[i] === snake.head ? '#F06020' : '#201010';
			ctx.fillRect(snake.nodes[i][0] * cellSize, snake.nodes[i][1] * cellSize, cellSize, cellSize);
		}
		
		ctx.fillStyle = '#20C8F0';
		ctx.fillRect(
			fish[0] * cellSize, fish[1] * cellSize,
			cellSize, cellSize);
		
		ctx.strokeStyle = '#F08080';
		ctx.lineWidth   = width / 200;
		ctx.strokeRect(
			ctx.lineWidth / 2, ctx.lineWidth / 2,
			size * cellSize - ctx.lineWidth, size * cellSize - ctx.lineWidth);
		ctx.restore();
		
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		text(ctx, `${this.points}\n${this.highScore}`, width * 0.025, height * 0.025, {
			font: `bold ${(width / 20) | 0}px monospace`,
			spacing: width / 40,
		}, '#20C8F0');
	},
	get over()
	{
		return this.snake.OOB(size, size) || this.snake.bitSelf;
	},
	spawnFish()
	{
		const { snake, fish } = this;
		if (snake.nodes.length >= size ** 2)
		{
			return;
		}
		const check = () =>
		{
			for (const node of snake.nodes)
			{
				if (fish[0] === node[0] || fish[1] === node[1])
				{
					return false;
				}
			}
			return true;
		};
		do
		{
			fish[0] = (Math.random() * size) | 0;
			fish[1] = (Math.random() * size) | 0;
		} while (!check());
	},
	onSwipe(dir)
	{
		this.snake.turn(dir);
	}
});

export default function main()
{
	const canvas = document.querySelector`canvas`;
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	const ctx = canvas.getContext`2d`;
	
	const size = 30;
	const game = Game({
		snakePos: [0, 0],
		tick: 100,
		cellSize: Math.min(canvas.width, canvas.height) / size,
		size,
	});
	const startGame = () =>
	{
		game.init();
		window.requestAnimationFrame(draw);
	};
	
	const draw = (() =>
	{
		let time = 0;
		const timer = Timer();
		return mil =>
		{
			timer.update(mil);
			if (!game.over)
			{
				window.requestAnimationFrame(draw);
			}
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			game.draw(ctx);
			time += timer.tick;
			if (time >= game.tick)
			{
				game.update();
				time = 0;
			}
		};
	})();
	
	const MC = new Hammer.Manager(canvas);
	MC.add(new Hammer.Swipe());
	MC.add(new Hammer.Tap());
	MC.on("swipe", e =>
	{
		const { deltaX: x, deltaY: y } = e;
		game.onSwipe((() =>
		{
			if (Math.abs(x) > Math.abs(y))
			{
				return x < 0 ? Dir.LEFT : Dir.RIGHT;
			}
			return y < 0 ? Dir.UP : Dir.DOWN;
		})());
	});
	MC.on('tap', e =>
	{
		if (game.over)
		{
			startGame();
		}
	});
	
	startGame();
}
