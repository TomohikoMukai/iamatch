# coding: utf-8
# ID,開始時刻,完了時刻,メール,名前,学修番号,氏名,累積GPA,取得単位総計,第k希望 スタジオ,第k希望 履修ポイント, メールアドレス（緊急時に連絡の取れるアドレス）, 携帯電話（緊急時に連絡の取れる電話番号）
import csv
import random
import uuid

filename_output = "sample.csv"
number_of_row = 50  # 50人分
array_studio = [
    "Editorial", "EquipmentService", "Ergonomics", "Interactive",
    "Interface", "Interior", "Kinematograph", "Network", "Software",
    "Spatial", "Transportation", "VisualCommunication"
]
# csvファイルの最初の列が指定する文字列を含めばその行を別ファイルに出力する例
f_out = open(filename_output, 'w')

print('timestamp', 'email', 'number', 'name',
      'GPA', 'credit', sep=',', end=',', file=f_out)
for studio in array_studio:
    print(studio, 'score', sep=',', end=',', file=f_out)
print('', end='\n', file=f_out)

for id in range(0, number_of_row):
    print('timestamp', 'email', 'number',
          str(id),
          str(random.uniform(2.0, 4.0)),
          str(random.randint(94, 131)),
          sep=',', end=',', file=f_out)

    rank_choice = list(range(1, len(array_studio)+1))
    random.shuffle(rank_choice)

    count = 0
    for studio in array_studio:
        score = int(5 *
                    ((len(array_studio)-rank_choice[count]))/float(len(array_studio)))
        print(rank_choice[count], score)
        print(rank_choice[count],
              str(random.randint(int(score), 5)),
              sep=',', end=',', file=f_out)
        count += 1

    print('', end='\n', file=f_out)
f_out.close()
