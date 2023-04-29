import './style.css';
import { createGame } from './game';

let abstractChat = '...';

const setUpGame = (game, element) => {
  let targetId = null;

  const stateElement = document.createElement('div');
  stateElement.className = 'state';
  element.appendChild(stateElement);

  const meElement = document.createElement('input');
  meElement.className = 'me';
  meElement.value = '내 엔티티를 움직여서 너의 엔티티를 죽여버리겠어!';
  // element.appendChild(meElement);

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

      const command = {
        description: meElement.value,
        entityId: targetId,
        targetY: y,
        targetX: x,
      };

      buffer.push(JSON.stringify(command));
      game.dispatch(command);

      targetId = null;
    }
  });
  element.appendChild(fieldElement);

  const chatElement = document.createElement('div');
  chatElement.className = 'chat';
  element.appendChild(chatElement);

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
      div.textContent = entity.id;
      fieldElement.appendChild(div);
    });
  };

  // element에 게임의 상태를 그리고, entity들을 그린다
  const render = () => {
    drawState();
    drawField();
    chatElement.innerHTML = `ChatGPT: ${abstractChat}`;
  };

  // 브라우저 주사율마다 render를 실행한다
  const loop = () => {
    render();
    requestAnimationFrame(loop);
  };

  loop();
};

const game = createGame({});

const getAbstractEntities = () =>
  JSON.stringify(
    game.state.entities
      .filter((entity) => entity.isLive)
      .map((entity) => {
        return {
          id: entity.id,
          player: entity.owner,
          x: Math.floor(entity.x),
          y: Math.floor(entity.y),
        };
      })
  );

const messages = [
  {
    role: 'user',
    content: `너는 아주 똑똑한 아이야.
나와 둘이서 게임을 하자.
너와 내가 경쟁해서 한 명이 이기면 되는거야.
이 게임엔 필드가 있어. 필드는 500x500 크기의 정사각형이야.
이 필드 위에는 엔티티이 있어. 엔티티는 지름이 10인 원이야.
플레이어는 엔티티를 3개 씩 가지고 있어.

엔티티는 필드 안에 존재하며 id와 좌표 등의 상태값이 아래와 같이 표현돼:
${getAbstractEntities()}

그리고 플레이어는 한 턴에 한 번씩 엔티티 1개에 대해 가속 명령을 내릴 수 있어.
가속 명령은 다음과 같은 형식이어야해:
{
  description: 'id가 4인 상대방 엔티티를 죽이기 위해서 가장 가까운 id가 0인 엔티티를 해당 방향으로 가속합니다.',
  entityId: 0,
  targetX: 200,
  targetY: 400
}

이 가속 명령을 내리면, id가 0인 엔티티가 (200, 400) 방향으로 가속되서 일정 거리(대략 125)만큼 이동하게 돼.
description 속성에는 targetX와 targetY를 설정한 이유와 entitiyId를 설정한 이유를 최대한 상세하게 적어야해. 이건 아주 중요하니까 꼭 지켜줘.
description 속성에 계속 똑같은 말을 적는 것도 지양해줘.
만약 엔티티가 이동하면서 상대 엔티티와 부딪히게 되면 상대 엔티티를 field에서 제거하게 돼.
이렇게 게임을 진행하면서 상대방의 모든 엔티티를 제거하면 이기게 돼.

이해했어?`,
  },
  {
    role: 'assistant',
    content:
      '네, 이해했습니다. 플레이어는 각각 3개의 유닛을 가지고 있고, 엔티티는 500x500 크기의 정사각형 안에 있으며 지름이 10인 원으로 표현됩니다. 플레이어는 한 턴에 한 번씩 엔티티 1개에 대해 가속 명령을 내릴 수 있으며, 이동 시 상대방 엔티티와 부딪히면 상대방 엔티티를 제거할 수 있습니다. 게임을 진행하다가 상대방의 모든 엔티티를 제거하면 이기는 것이 맞나요?',
  },
];

const buffer = [];

buffer.push(`맞아. 좋아. 한 번 해보자.
나는 player1, 너는 player2로 게임을 시작해보자.

- System: 게임이 시작됐습니다.
- System: '${game.state.playerIds[game.state.turn % 2]}'의 턴입니다.
- System: 현재 게임 엔티티들의 상태는 아래와 같습니다.
${getAbstractEntities()}
- System: '${
  game.state.playerIds[game.state.turn % 2]
}'님 명령을 입력해주세요.`);

game.subscribe(console.log);

game.subscribe((action) => {
  const type = action.type;

  if (type === 'entity-out') {
    buffer.push(
      `- System: 'id가 ${action.entity.id}인 엔티티'가 필드를 벗어나 죽었습니다.`
    );
  }

  if (type === 'entity-killed') {
    buffer.push(
      `- System: 'id가 ${action.killer.id}인 엔티티'가 'id가 ${action.victim.id}인 엔티티'를 죽였습니다.`
    );
  }

  if (type === 'gameover') {
    buffer.push(
      `- System: '${action.winnerId}'가 승리했습니다. 게임이 종료됐습니다.`
    );
  }

  if (type === 'turn-changed') {
    buffer.push(`- System: 턴이 변경됐습니다.
- System: '${game.state.playerIds[action.turn % 2]}'의 턴입니다.
- System: 현재 게임 엔티티들의 상태는 아래와 같습니다.
${getAbstractEntities()}
- System: '${
      game.state.playerIds[game.state.turn % 2]
    }'님 명령을 입력해주세요.`);

    // 만약 chatGPT의 턴이라면 메시지를 전송해준다.
    if (game.state.playerIds[action.turn % 2] === 'player2') {
      messages.push({
        role: 'user',
        content: buffer.join('\n'),
      });
      buffer.length = 0;
      chat();
    }
  }

  if (type === 'invalid-action') {
    buffer.push(
      `- System: 잘못된 명령입니다. ${action.message} '${
        game.state.playerIds[game.state.turn % 2]
      }'님 다시 명령을 말씀해주세요.`
    );

    // 만약 chatGPT의 턴이라면 메시지를 전송해준다.
    if (game.state.playerIds[game.state.turn % 2] === 'player2') {
      messages.push({
        role: 'user',
        content: buffer.join('\n'),
      });
      buffer.length = 0;
      chat();
    }
  }

  if (type === 'entity-accelerated') {
    buffer.push(
      `- System: 'id가 ${action.entity.id}인 엔티티'가 'y: ${action.targetPosition.targetY}, x: ${action.targetPosition.targetX}' 방향을 향해 이동합니다.`
    );
  }
});

setUpGame(game, document.querySelector('#app'));
setInterval(game.update, 1000 / 50);

function chat() {
  const start = messages.length < 10 ? 0 : messages.length - 10;
  const end = start + 10;

  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_CHAT_GPT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: messages.slice(start, end),
    }),
  })
    .then((res) => res.json())
    .then((data) => data.choices[0].message)
    .then((message) => {
      const cmd = JSON.parse(message.content);
      game.dispatch(cmd);
      abstractChat = cmd.description;

      messages.push(message);
    });
}
