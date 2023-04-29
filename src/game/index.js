const createIdGenerator = () => {
  let id = 0;
  return {
    generate: () => {
      return id++;
    },
  };
};

const createGame = (options) => {
  const entityIdGenerator = createIdGenerator();

  const subscribers = [];
  const subscribe = (dispatch) => {
    subscribers.push(dispatch);
  };
  const unsubscribe = (dispatch) => {
    const index = subscribers.indexOf(dispatch);
    if (index !== -1) {
      subscribers.splice(index, 1);
    }
  };
  const emit = (action) => {
    subscribers.forEach((dispatch) => {
      dispatch(action);
    });
  };

  const createEntity = ({
    owner,
    y,
    x,
    vy = 0,
    vx = 0,
    r = 10,
    p = 15,
    isLive = true,
  }) => {
    const entity = {
      id: entityIdGenerator.generate(),
      owner,
      y,
      x,
      vy,
      vx,
      r,
      p,
      isLive,
    };

    return entity;
  };

  const state = {
    turn: 0,
    process: 'idle',
    playerIds: ['player1', 'player2'],
    entities: [
      createEntity({ owner: 'player1', y: 100, x: 200 }),
      createEntity({ owner: 'player1', y: 100, x: 250 }),
      createEntity({ owner: 'player1', y: 100, x: 300 }),
      createEntity({ owner: 'player2', y: 400, x: 200 }),
      createEntity({ owner: 'player2', y: 400, x: 250 }),
      createEntity({ owner: 'player2', y: 400, x: 300 }),
    ],
    fieldSize: 500,
    k: 0.875,
  };

  const update = () => {
    state.entities.forEach((entity) => {
      entity.y += entity.vy;
      entity.x += entity.vx;
    });

    state.entities.forEach((entity) => {
      entity.vy *= state.k;
      entity.vx *= state.k;

      // entity.vx ** 2 + entity.vy ** 2가 일정값 이하일 때 vx와 vy를 0으로 설정한다
      if (entity.vx ** 2 + entity.vy ** 2 < 0.001) {
        entity.vx = 0;
        entity.vy = 0;
      }
    });

    state.entities.forEach((entity) => {
      if (
        entity.isLive &&
        (entity.x < 0 ||
          entity.x > state.fieldSize ||
          entity.y < 0 ||
          entity.y > state.fieldSize)
      ) {
        entity.isLive = false;
        // 엔티티가 필드를 벗어나서 죽었다는 것을 알린다
        emit({ type: 'entity-out', entity });
      }
    });

    // owner가 다른 엔티티끼리 충돌 검사한다
    state.entities.forEach((entity) => {
      // 죽은 엔티티는 제외한다.
      if (!entity.isLive) return;

      state.entities.forEach((other) => {
        // 죽은 엔티티는 제외한다.
        if (!other.isLive) return;

        if (entity.owner !== other.owner) {
          const dx = entity.x - other.x;
          const dy = entity.y - other.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < entity.r + other.r) {
            // owner가 playerIds[turn]이 아닌 엔티티를 죽인다
            if (
              entity.owner !==
              state.playerIds[state.turn % state.playerIds.length]
            ) {
              entity.isLive = false;
              emit({
                type: 'entity-killed',
                killer: entity,
                victim: other,
              });
            }
            if (
              other.owner !==
              state.playerIds[state.turn % state.playerIds.length]
            ) {
              other.isLive = false;
              emit({
                type: 'entity-killed',
                killer: other,
                victim: entity,
              });
            }
          }
        }
      });
    });

    // 특정 플레이어의 엔티티가 모두 죽으면 게임을 종료한다
    const isPlayerLive = (playerId) =>
      state.entities.some(
        (entity) => entity.owner === playerId && entity.isLive
      );
    if (!state.playerIds.every(isPlayerLive)) {
      state.process = 'gameover';
      emit({
        type: 'gameover',
        winnerId: state.playerIds.find((playerId) => isPlayerLive(playerId)),
      });
    }

    // 이동 중인 엔티티가 없으면 턴을 변경한다
    if (
      state.process === 'move' &&
      state.entities.every((entity) => entity.vx ** 2 + entity.vy ** 2 === 0)
    ) {
      state.process = 'idle';
      state.turn += 1;
      emit({
        type: 'turn-changed',
        turn: state.turn,
      });
    }
  };

  const dispatch = ({ entityId, dy, dx }) => {
    emit({
      type: 'dispatched',
      action: { entityId, dy, dx },
    });
    const entity = state.entities.find((entity) => entity.id === entityId);

    // 현재 프로세스가 idle이 아니면 이동할 수 없다
    if (state.process !== 'idle') {
      emit({
        type: 'invalid-action',
        message: '이동할 수 없는 상태입니다.',
      });
      return;
    }

    // 현재 플레이어의 턴이 아니면 이동할 수 없다
    if (state.playerIds[state.turn % state.playerIds.length] !== entity.owner) {
      emit({
        type: 'invalid-action',
        message: '자신의 턴이 아니면 이동할 수 없습니다.',
      });
      return;
    }

    // 죽은 엔티티는 이동할 수 없다
    if (!entity.isLive) {
      emit({
        type: 'invalid-action',
        message: '죽은 엔티티는 이동할 수 없습니다.',
      });
      return;
    }

    // 해당하는 엔티티를 찾고, 속도를 설정한다
    if (entity) {
      const angle = Math.atan2(dy - entity.y, dx - entity.x);
      entity.vy += Math.sin(angle) * entity.p;
      entity.vx += Math.cos(angle) * entity.p;
      state.process = 'move';

      // 엔티티가 가속도를 받아 이동했다는 것을 알린다
      emit({
        type: 'entity-accelerated',
        entity: entity,
        targetPosition: { dy, dx },
      });
    } else {
      emit({
        type: 'invalid-action',
        message: '해당하는 엔티티가 없습니다.',
      });
    }
  };

  return {
    state,
    update,
    dispatch,
    subscribe,
    unsubscribe,
  };
};

export { createGame };
