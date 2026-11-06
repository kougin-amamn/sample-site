// エフェクトの登録所。各エフェクトは Effects.add({...}) で自分を登録する。
//
// 登録する形：
// Effects.add({
//   id, name, hint, about, file,
//   create() {                    // 切り替えるたびに呼ばれ、1つの動く実体を返す
//     return {
//       resize(w, h) {},          // キャンバスの大きさ（CSSピクセル）
//       frame(ctx, dt, t, power) {},  // 毎フレームの描画。dt=前回からの秒, t=経過秒, power=強さ1〜10
//       pointer(x, y, kind) {}    // kind: "down" | "drag" | "move"（省略可）
//     };
//   }
// });
const Effects = {
  list: [],
  add(def) { this.list.push(def); }
};
const rand = (a, b) => a + Math.random() * (b - a);
