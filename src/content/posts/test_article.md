---
title: 野鳥の声をタイマー録音するためのTASCAM DR-05Xレビュー
pubDate: 2024-10-10T09:11:19.000Z
updatedDate: 2025-02-07T18:21:51.000Z
tags:
  - ICレコーダー
  - DR-05X
  - タイマー録音
isDraft: false
description: >-
  鳥類の音声研究用にDR-05Xを試しました。目的は夜のフライトコール（NFC）調査です。ファイルのタイムスタンプは終了時間で、USB給電しながら録音できます。128GBのSDカードがさせるのが良い。USB給電で録音できるのが良い。ファイルは2GBが上限でそれを超えると自動分割され、その場合でもタイムスタンプは分割した時刻がそれぞれの終了と開始時刻に正しく設定されていました。NiH充電池で15時間連続録音できました。ファイル間に数秒ギャップがあります。なお、中古で購入したがファームウエアを新しくすることでタイマー機能を追加することができました。
category: Technology
heroImage: ./IMG_5554x1200.JPG
---



![TASCAM DR-05Xの箱](https://object-storage.tyo2.conoha.io/v1/nc_938a9d00d6004f1390c354d4a15ef25b/blog-astro-assets/blog-images/test_article/IMG_5554x1200.JPG){.img-fluid}

## まとめ

- NFCの録音機として使える印象
- NFCを想定したICレコーダの観点で調査した
- タイマーが一つ設定できる（◎）
- ファイルのタイムスタンプは終了時刻で2.15GBで自動分割されたファイルのタイムスタンプも正確
- 自動分割されたファイルには数秒ギャップがある。
- NiH充電池のフル充電からの連続録音は15時間
- 外部給電しながら録音できる（◎）
- 最大128GBのSDカードと容量が大きいく、例えばパワーバス録音で一晩12時間を16晩録音できる(WAV:44.1KHz/16bit)（◎）
- 録音感度は他の機種（オリンパスDM-750）と比べて同等の印象（SN比など未調査）

## 主な仕様

| 項目           | DR-05X仕様                                                   | 備考                                                         |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| フォーマット   | WAV 24bit, WAV 16bit, MP3 32k, MP3 64k, MP3 96k, MP3 128k, MP3 192k, MP3 256k,MP3 320k | 最大128GBのSDカードに対応(44.1KHz/16bitの録音で192時間）     |
| サンプル       | 44.1k, 46k, 96k                                              |                                                              |
| 量子化ビット   | 24bit, 16bit                                                 |                                                              |
| チャネル       | ステレオ、モノラル                                           | 無指向性ステレオマイク                                       |
| 録音サイズ     | 2G, 1G,  512M, 256M, 128M, 64M                               |                                                              |
| LPF            | オフ, 40Hz, 80Hz, 120Hz, 220Hz                               |                                                              |
| 録音レベル     | 0~90ステップ                                                 |                                                              |
| 事前録音お     | オフ, オン                                                   |                                                              |
| 自動録音       | オフ, 新ファイル, マーク                                     |                                                              |
| 開始レベル     | -6dB, -12dB, -24dB, -48dB                                    |                                                              |
| タイムスタンプ | 録音終了                                                     |                                                              |
| タイマー機能   | 一回、もしくは毎日の特定時刻を設定できる                     | firmwareのバージョンが古いものにはタイマー機能がないものがある。中古品は気をつけて欲しい。[ファームウエアはver1.6](https://tascam.jp/jp/product/dr-05x/download#download3)が最新である[2024-10-10] |
| 購入価格       | ￥12,870（新品）                                             | [amazonの商品ページ](https://amzn.to/488X4c3)                |

### 電池の持ち

- DR-05Xの連続録音時間は15:03:44であった。
- 同時に録音したDR-05は16:02:40で少しDR-05の方が消費電力が少ないようだ。
- 録音条件：電池（単3電池２本）：NiH（満充電＝1.35V）から1.25V（気温23度で測定）。Audio: pcm_s16le, 44100 Hz, 2 channels, s16, 1411 kb/s。

### 録音情報（タイムスタンプは終了時間でした）

- OSXのターミナルで`ffmpeg`をインストールし、同封の`ffprobe`を利用して録音メタデータを見てみました。
- 時刻合わせをした後、96KHz-WAV/MP3フォーマットで録音しこれを確認した。
- 録音データは128GBのmicro-SDカードに格納され、SDカードをMacで読み出す方法と、SDカードリーダーモードで読み出した。以下のコマンドを実行
- デフォルトのディレクトリは`/Volumes/DR-05X/MUSIC`になっているが、本体をUSB接続すると`/Volumes/DR-05X/MUSIC/DR05X_0000/`に見える（SDカードリーダーモードの場合）。
- 結果は、以下の通り。

<pre class="m-0"><code>

```{bash}
##### WAVの場合：
$ ffprobe TASCAM_0017.wav 
...
  Metadata:
    encoded_by      : TASCAM PCM Recoder DR-05X      
    date            : 2024-10-10
    creation_time   : 09:23:30
    time_reference  : 3242782848
    coding_history  : 
  Duration: 00:00:30.77, bitrate: 3072 kb/s
  Stream #0:0: Audio: pcm_s16le ([1][0][0][0] / 0x0001), 96000 Hz, 2 channels, s16, 3072 kb/s

##### OS組み込みのファイル状態の取得
$ stat /Volumes/DR-05X/MUSIC/TASCAM_0017.wav 
  File: /Volumes/DR-05X/MUSIC/TASCAM_0017.wav
  Size: 11816080  	Blocks: 23296      IO Block: 1048576 regular file
Device: 1,42	Inode: 8           Links: 1
Access: (0700/-rwx------)  Uid: (  501/   osaka)   Gid: (   20/   staff)
Access: 2024-10-10 10:32:58.000000000 +0900
Modify: 2024-10-10 09:23:30.000000000 +0900
Change: 2024-10-10 09:23:30.000000000 +0900
 Birth: 2024-10-10 09:22:04.000000000 +0900
##### → BirthにDurationを加えてもModifyにならない。Birthは録音ボタンを押した時刻であり、ポーズ状態から録音開始させた時が真の録音開始時刻となることに注意。


##### MP3の場合：
$ ffprobe /Volumes/DR-05X/MUSIC/DR05X_0000/TASCAM_0018.mp3 
...
  Metadata:
    title           : TASCAM_0018.mp3
    album           : TASCAM DR-05X
  Duration: 00:01:06.53, start: 0.000000, bitrate: 320 kb/s
  Stream #0:0: Audio: mp3 (mp3float), 48000 Hz, stereo, fltp, 320 kb/s
##### → Metadataにはcreation_timeはない

##### statコマンドでタイムスタンプを確認
$ stat /Volumes/DR-05X/MUSIC/DR05X_0000/TASCAM_0018.mp3
  File: /Volumes/DR-05X/MUSIC/DR05X_0000/TASCAM_0018.mp3
  Size: 2663000   	Blocks: 5376       IO Block: 1048576 regular file
Device: 1,42	Inode: 166         Links: 1
Access: (0700/-rwx------)  Uid: (  501/   osaka)   Gid: (   20/   staff)
Access: 2024-10-10 10:12:38.000000000 +0900
Modify: 2024-10-10 10:12:38.000000000 +0900
Change: 2024-10-10 10:12:38.000000000 +0900
 Birth: 2024-10-10 10:11:30.000000000 +0900

##### lsコマンドで確認：
$ ll !$
ll /Volumes/DR-05X/MUSIC/DR05X_0000/TASCAM_0018.mp3
-rwx------ 1 osaka staff 2663000 2024-10-10 10:12:38 /Volumes/DR-05X/MUSIC/DR05X_0000/TASCAM_0018.mp3
#####  →　タイムスタンプは終了時刻


##### ファイルをコピーしてタイムスタンプを確認
$ cp !$ ~/Desktop
$ stat ~/Desktop/TASCAM_0018.mp3 
  File: /Users/osaka/Desktop/TASCAM_0018.mp3
  Size: 2663000   	Blocks: 5208       IO Block: 4096   regular file
Device: 1,13	Inode: 22889090    Links: 1
Access: (0700/-rwx------)  Uid: (  501/   osaka)   Gid: (   20/   staff)
Access: 2024-10-10 10:22:09.507824121 +0900
Modify: 2024-10-10 10:12:38.000000000 +0900
Change: 2024-10-10 10:22:09.680762654 +0900
 Birth: 2024-10-10 10:11:30.000000000 +0900
#### → Access, Changeは更新され、ModifyとBirthは変更がない。
$ ll !$; # lsコマンドが示す日時は、通常「最終変更時刻」（modification time）
ll ~/Desktop/TASCAM_0018.mp3
-rwx------ 1 osaka staff 2663000 2024-10-10 10:12:38 /Users/osaka/Desktop/TASCAM_0018.mp3
```

</code></pre>

- まとめると
  - WAVにはMetaDataが格納されており、`creation_time`は録音終了時間である。
  - `stat`コマンドの`birth`は録音ボタンが押された時刻であり、録音開始時刻の取得は`modify`時刻から`duration`を引く必要がある。
  - MP3にはMetaDataは`duration` と`bithrate`しかないのでタイムスタンプはOSのファイル属性から読む必要があり、`stat`で見ると`modify`時刻が**録音終了時刻**を意味しており、これはファイルコピーでは変更されない(OSX:sonoma 14.6.1で確認)。そのため、録音開始時刻はWAVと同様に`modify-duration`で取得できる。

### 使い勝手

- [USBのコネクタ](https://www.pc-koubou.jp/magazine/55745)はUSB2.0 micro-BでUSBから給電しながら録音できる（図２）。これはいい。USBコネクタのカバーはないので霧の中など注意が必要。
- メモリが128GB使えるのはとてもいい。
- フォルダも新規に作成して、デフォルトの`MUSIC`から`DR05X_000`に変更できます。
- 2GBで自動分割された時のタイムスタンプは正確でした。２つ目以降の`birth`時刻は、一つ前の`modified`時刻に等しかったので、自動分割されてもそれぞれのファイルタイムスタンプ情報で正しく復元できます。Goodです。
- ちなみにKIOXIAの128GBを使っています。このメモリのスピードは`write`が70MB/s、`read`が90MB/s程度でした（図3）。
- EMC：コンパスアプリを表示させたiPhone(13Pro)をDR-05Xの真上において録音したら電磁干渉があった。今後現場での使用感を追加したいが、多くのフィールドでは通信弱電地帯であり、そこでは大きな電力で基地局と通信しようとするのでより電磁干渉が顕著となりうる。
- この購入品はタイマー機能がなく、箱を見ると欧州リテール品でした。おなじDR-05Xでもタイマーがないものがあることに気をつけてください。ファームウエアのアップデートでタイマーが使える様になります。
- 電池ケースは単三乾電池にピッタリでほんの少し太い充電式電池を入れるとケースの締まりが甘くなりすぐ開いてしまう。ここはDR-05 mk IIと同じで改善して欲しい点。養生テープでいつも仮止めしています。
- ケース：これ専用を謳っている[ケース](https://amzn.to/4ezkIkr)を見つけたのでこれにピッタリ入りこれで持ち運ぶことにしました（図4）。



<img src="https://object-storage.tyo2.conoha.io/v1/nc_938a9d00d6004f1390c354d4a15ef25b/blog-astro-assets/blog-images/3D7EE764D1B34FE28ACF38B175848A1A/IMG_5559x1200.JPG" alt="図２　USBコネクタはUSB2.0 micro-Bタイプである。給電しながら録音できる。" style="zoom:50%;" />



<img src="https://object-storage.tyo2.conoha.io/v1/nc_938a9d00d6004f1390c354d4a15ef25b/blog-astro-assets/blog-images/3D7EE764D1B34FE28ACF38B175848A1A/BLACKMAGIC-KIOXIA-128GB-SDXC_UHS-I_CARDx1200.png" alt="図３　BLACKMAGIC KIOXIA 128GB SDXC UHS-I CARD" style="zoom:50%;" />

<img src="https://object-storage.tyo2.conoha.io/v1/nc_938a9d00d6004f1390c354d4a15ef25b/blog-astro-assets/blog-images/3D7EE764D1B34FE28ACF38B175848A1A/IMG_5557x1200.JPG" alt="図４　DR-05X専用を謳うケースにはピッタリ入った" style="zoom:50%;" />

以上です。
