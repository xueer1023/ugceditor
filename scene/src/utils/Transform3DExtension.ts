interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * ! 暂只支持世界坐标
 * @param position
 * @param target
 * @param up
 */
export const getLookAtRotation = (
  position: Laya.Vector3,
  target: Laya.Vector3,
  up: Laya.Vector3 = new Laya.Vector3(0, 1, 0)
): Laya.Quaternion | undefined => {
  const _rotation = new Laya.Quaternion(0, 0, 0, 1);
  const worldPosition = position;
  if (
    Math.abs(worldPosition.x - target.x) < Laya.MathUtils3D.zeroTolerance &&
    Math.abs(worldPosition.y - target.y) < Laya.MathUtils3D.zeroTolerance &&
    Math.abs(worldPosition.z - target.z) < Laya.MathUtils3D.zeroTolerance
  ) {
  } else {
    Laya.Quaternion.lookAt(worldPosition, target, up, _rotation);
    _rotation.invert(_rotation);
    return _rotation;
  }
};

export const positionTween = (config: {
  from?: Vector3 | Laya.Vector3;
  target: Vector3 | Laya.Vector3;
  duration?: number;
  camera: Laya.Camera;
}) => {
  let { from, target, duration, camera } = config;
  from = from ?? camera.transform.position;
  duration = duration ?? 3000;

  const updatePosition = { x: from.x, y: from.y, z: from.z };
  const targetPosition = { x: target.x, y: target.y, z: target.z };
  Laya.Tween.to(
    updatePosition,
    targetPosition,
    duration,
    Laya.Ease["cubicInOut"]
  ).update = new Laya.Handler(this, () => {
    camera.transform.position = new Laya.Vector3(
      updatePosition.x,
      updatePosition.y,
      updatePosition.z
    );
  });
};

export const rotationTween = (config: {
  from?: Laya.Quaternion;
  target: Laya.Quaternion;
  duration?: number;
  camera: Laya.Camera;
}) => {
  let { from, target, duration, camera } = config;
  from = from ?? camera.transform.rotation;
  duration = duration ?? 1500;

  const fromRotation = new Laya.Quaternion(from.x, from.y, from.z, from.w);
  const targetRotation = new Laya.Quaternion(
    target.x,
    target.y,
    target.z,
    target.w
  );

  const t = { t: 0 };
  Laya.Tween.to(t, { t: 1 }, duration, Laya.Ease["cubicInOut"]).update =
    new Laya.Handler(this, () => {
      const out = new Laya.Quaternion();
      Laya.Quaternion.slerp(fromRotation, targetRotation, t.t, out);
      camera.transform.rotation = out;
    });
};
