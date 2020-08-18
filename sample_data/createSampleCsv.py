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

print('ID', 'timestamp1', 'timestamp2', '365 email', '365 name', 'number', 'name',
      'GPA', 'credit', sep=',', end=',', file=f_out)
for studio in array_studio:
    print('studio name', 'score', sep=',', end=',', file=f_out)
print('emergency email', 'cellphone', sep=',', file=f_out)

for id in range(0, number_of_row):
    random.shuffle(array_studio)
    print(id, 'hogehoge', 'hogehoge', 'email', 'Name',
          str(random.randint(1000000, 9999999)),
          str(uuid.uuid4()),
          str(random.uniform(2.0, 4.0)),
          str(random.randint(94, 131)),
          sep=',', end=',', file=f_out)

    count_studio = len(array_studio)
    for studio in array_studio:
        print(studio,
              str(random.randint(
                  int(5.0*(count_studio/float(len(array_studio)))), 5)),
              sep=',', end=',', file=f_out)
        count_studio -= 1

    print('Email2', 'phonenumber', sep=',', file=f_out)
f_out.close()
