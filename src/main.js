import './style.css';
import { createGame } from './game';

const setUpGame = (game, element) => {
  let targetId = null;

  const stateElement = document.createElement('div');
  stateElement.className = 'state';
  element.appendChild(stateElement);

  const fieldElement = document.createElement('div');
  fieldElement.className = 'field';
  fieldElement.style.position = 'relative';
  fieldElement.style.width = `${game.state.fieldSize}px`;
  fieldElement.style.height = `${game.state.fieldSize}px`;
  fieldElement.addEventListener('mousedown', (event) => {
    // event.target이 entity라면
    if (event.target.classList.contains('entity')) {
      // entity의 id를 가져온다
      const entityId = Number(event.target.dataset.entityId);

      if (entityId === targetId) {
        targetId = null;
      } else {
        targetId = entityId;
      }
    } else {
      if (targetId === null) return;

      // 필드 상의 좌표를 가져온다
      const x = event.offsetX;
      const y = event.offsetY;
      // game에 전달한다
      game.dispatch({
        entityId: targetId,
        dy: y,
        dx: x,
      });

      targetId = null;
    }
  });
  element.appendChild(fieldElement);

  const inputElement = document.createElement('input');
  inputElement.className = 'input';
  inputElement.addEventListener('keydown', (event) => {
    // 엔터를 입력하면
    if (event.key === 'Enter') {
    }
  });
  element.appendChild(inputElement);

  // element에 게임의 상태를 그린다
  const drawState = () => {
    stateElement.innerHTML = `
    <div class="state__turn">Turn: ${game.state.turn}</div>
    <div class="state__process">Process: ${game.state.process}</div>
    <div class="state__players">Players: ${game.state.playerIds.join(
      ', '
    )}</div>
  `;
  };

  // element에 entity들을 그린다
  const drawField = () => {
    fieldElement.innerHTML = '';
    game.state.entities.forEach((entity) => {
      const div = document.createElement('div');
      div.className = `entity entity--${entity.owner} ${
        entity.isLive ? '' : 'entity--dead'
      } ${entity.id === targetId ? 'entity--target' : ''}`;
      div.dataset.entityId = entity.id;
      div.style.position = 'absolute';
      div.style.left = `${entity.x - entity.r}px`;
      div.style.top = `${entity.y - entity.r}px`;
      div.style.width = `${entity.r * 2}px`;
      div.style.height = `${entity.r * 2}px`;
      fieldElement.appendChild(div);
    });
  };

  // element에 게임의 상태를 그리고, entity들을 그린다
  const render = () => {
    drawState();
    drawField();
  };

  // 브라우저 주사율마다 render를 실행한다
  const loop = () => {
    render();
    requestAnimationFrame(loop);
  };

  loop();
};

const game = createGame({});
setUpGame(game, document.querySelector('#app'));
setInterval(game.update, 1000 / 50);
