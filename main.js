'use strict';
/*
 a basic, no-frills snake game
 — K. Russell Smith
*/
import { Timer, text } from './aux.js';
const Dir = {
	LEFT:   [-1, +0],
	RIGHT:  [+1, +0],
	UP:     [+0, -1],
	DOWN:   [+0, +1],
};
// Precomputed:
Dir.inverse = (() =>
{
	const compleMap = (...pairs) =>
	{
		const result = {};
		for (const pair of pairs)
		{
			result[pair[0]] = pair[1];
			result[pair[1]] = pair[0];
		}
		return result;
	};
	return compleMap(
		[Dir.LEFT, Dir.RIGHT],
		[Dir.UP,   Dir.DOWN]);
})();

class Snake
{
	constructor(x, y, grid)
	{
		this.dir = Dir.RIGHT;
		this.nodes = [[x, y]];
		this.grid  = grid;
	}
	grow()
	{
		const [ x, y ] = this.nodes[0];
		const [ growX, growY ] = this.dir;
		this.nodes.splice(0, 0, [x + growX, y + growY]);
	}
	move()
	{
		const { head, dir } = this;
		for (let i = this.nodes.length - 1; i >= 1; --i)
		{
			this.nodes[i][0] = this.nodes[i - 1][0];
			this.nodes[i][1] = this.nodes[i - 1][1];
		}
		head[0] += dir[0];
		head[1] += dir[1];
	}
	turn(dir)
	{
		if (this.length === 1 || dir !== Dir.inverse[this.dir])
		{
			this.dir = dir;
		}
	}
	get touchingSelf()
	{
		for (let i = this.nodes.length - 1; i >= 0; --i)
		{
			for (const node of this.nodes)
			{
				if (node === this.nodes[i])
				{
					continue;
				}
				if (
					this.nodes[i][0] === node[0] &&
					this.nodes[i][1] === node[1])
				{
					return true;
				}
			}
		}
		return false;
	}
	get head()
	{
		return this.nodes[0];
	}
	
	OOB(width, height)
	{
		for (let i = this.nodes.length - 1; i >= 0; --i)
		{
			const node = this.nodes[i];
			if (
				node[0] < 0 ||
				node[1] < 0 ||
				node[0] >= width ||
				node[1] >= height)
			{
				return true;
			}
		}
		return false;
	}
	get length()
	{
		return this.nodes.length;
	}
}
const Game = ({
	snakePos = [0, 0],
	tick     = 100,
	cellSize = 10,
	size     = 10}) =>
({
	tick,
	snake: null,
	fish: [0, 0],
	storageKey: 'KRS-snake-score',
	init()
	{
		this.snake = new Snake(snakePos[0], snakePos[1]),
		this.spawnFish();
		this.score     = 0;
		this.highScore = localStorage.getItem(this.storageKey) ?? 0;
		return this;
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
			++this.score;
			if (this.score >= this.highScore)
			{
				this.highScore = this.score;
				localStorage.setItem(this.storageKey, this.highScore);
			}
		}
		else
		{
			snake.move(snake.dir);
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
		ctx.fillStyle = '#80F080';
		for (const node of snake.nodes)
		{
			ctx.fillRect(node[0] * cellSize, node[1] * cellSize, cellSize, cellSize);
		}
		ctx.fillStyle = '#20C8F0';
		ctx.fillRect(fish[0] * cellSize, fish[1] * cellSize, cellSize, cellSize);
		ctx.strokeStyle = '#F08080';
		ctx.lineWidth   = 2;
		ctx.strokeRect(0, 0, size * cellSize, size * cellSize);
		ctx.restore();
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		text(ctx, `${this.score}\n${this.highScore}`, width * 0.025, height * 0.025, {
			font: `bold ${(width / 20) | 0}px monospace`,
			spacing: width / 40,
		}, '#20C8F0');
	},
	get over()
	{
		const { snake } = this;
		return snake.OOB(size, size) || snake.touchingSelf;
	},
	spawnFish()
	{
		const { snake, fish } = this;
		if (snake.length >= size ** 2)
		{
			return;
		}
		let check = () =>
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
		const { snake } = this;
		snake.turn(dir);
	}
});

export default function main()
{
	const canvas = document.querySelector`canvas`;
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	const ctx = canvas.getContext`2d`;
	const size = 30;
	
	const cellSize = (() =>
	{
		const { width, height } = canvas;
		return Math.min(width, height) / size;
	})();
	const config = {
		snakePos: [0, 0],
		tick: 100,
		cellSize,
		size,
	};
	let game = null;
	const startGame = () =>
	{
		game = Game(config).init();
		window.requestAnimationFrame(draw);
	};
	let time = 0;
	const timer = Timer();
	
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
	function draw(mil)
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
	}
	startGame();
}