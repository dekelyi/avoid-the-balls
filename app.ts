abstract class CanvasObject {
    public height: number;
    public width: number;

    abstract draw(): void;

    constructor(private _x: number, private _y: number, protected app: App) { }

    update(): void { }

    isColliding(obj: CanvasObject): boolean {
        return !(obj.x > (this.x + this.width) ||
            (obj.x + obj.width) < this.x ||
            obj.y > (this.y + this.height) ||
            (obj.y + obj.height) < this.y);
    }

    get x(): number {
        return this._x;
    }

    set x(val: number) {
        this._x = Math.min(Math.max(val, 0), this.app.width - this.width);
    }

    get y(): number {
        return this._y;
    }

    set y(val: number) {
        this._y = Math.min(Math.max(val, 0), this.app.height - this.height);
    }
}

class Player extends CanvasObject {
    draw(): void {
        this.app.ctx.fillStyle = 'green';
        this.app.ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    get width(): number {
        return this.height / 5;
    }

    get height(): number {
        return this.app.height / 5;
    }
}

class Ball extends CanvasObject {
    radius: number;

    constructor(x: number, y: number, app: App) {
        super(x, y, app);
        this.radius = Math.random() * 7 + 3;
    }

    draw(): void {
        this.app.ctx.beginPath();
        this.app.ctx.fillStyle = 'red';
        this.app.ctx.arc(this.drawX, this.drawY, this.radius, 0, Math.PI * 2);
        this.app.ctx.fill();
    }

    update() {
        this.x -= 10 / this.radius;
    }

    get height() {
        return this.radius * 2;
    }

    get width() {
        return this.radius * 2;
    }

    get drawX() {
        return this.x + this.radius;
    }

    get drawY() {
        return this.y + this.radius;
    }
}

enum GameMode {
    INIT,
    GAME,
    PAUSE,
    END,
    RELOAD
}

class App {
    player: Player;
    balls: Ball[];
    frames: number;
    points: number;
    mode: GameMode;

    constructor(public element: HTMLCanvasElement) {
        document.addEventListener("keydown", (e) => this.onKeyEvent(e))
        this.mode = GameMode.INIT;
    }

    get height() : number {
        return this.element.height;
    }

    get width(): number {
        return this.element.width;
    }

    get ctx(): CanvasRenderingContext2D {
        return this.element.getContext("2d");
    }

    init() {
        this.player = new Player(0, 0, this);
        this.balls = [];
        this.frames = 0;
        this.points = 0;
        this.mode = GameMode.GAME;
    }

    draw() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.player.draw();

        this.balls.forEach(b => b.draw());

        this.ctx.font = "30px Comic Sans MS";
        this.ctx.fillStyle = "black";
        this.ctx.textAlign = 'end';
        this.ctx.textBaseline = 'hanging'
        this.ctx.fillText(this.points.toString(), this.width, 0);
    }

    update() {
        if (this.frames % 50 == 0)
            this.balls.push(new Ball(this.width, Math.floor(Math.random() * this.height), this));
        [...this.balls, this.player].forEach(o => o.update());

        this.balls
            .filter(obj => obj.x === 0)
            .forEach(obj => {
                this.points++;
                this.balls.splice(this.balls.indexOf(obj), 1);
            });
    }

    check() {
        if (this.balls.some(b => b.isColliding(this.player)))
            this.mode = GameMode.END;
    }

    game(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let interval = setInterval(() => {
                this.frames++;
                this.draw();
                this.update();
                this.check()
                if (this.mode !== GameMode.GAME) {
                    clearInterval(interval);
                    resolve();
                }
            }, Math.floor(1000 / 70))
        });
    }

    async endGame(): Promise<void> {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.font = "70px Comic Sans MS";
        this.ctx.fillStyle = "red";
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(`You lost with ${this.points} points`, this.width / 2, this.height / 2, this.width);

        return new Promise<void>(resolve => document.addEventListener("keydown", () => resolve()));
    }

    async main() {
        switch (this.mode) {
            case GameMode.INIT:
                this.init(); break;
            case GameMode.GAME:
                await this.game(); break;
            case GameMode.END:
                await this.endGame(); break;
            case GameMode.RELOAD:
                await this.main(); break;
        }
    }

    onKeyEvent(event: any) {
        const DY = this.player.height / 5;
        switch (event.code) {
            case "ArrowDown":
                this.player.y += DY;
                break;
            case "ArrowUp":
                this.player.y -= DY;
                break;
            default:
                return;
        }

        this.draw();
 
        // Consume the event so it doesn't get handled twice
        event.preventDefault();
    }
}

window.onload = () => {
    const element = document.getElementById('app') as HTMLCanvasElement;
    const app = new App(element);
    (window as any).app = app;
    app.main();
};