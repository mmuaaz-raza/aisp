# from math import sqrt


# vectors =[ [3,4,5], [3,4,5]]

# dp = 0
# for values in zip(*vectors):
#     product = 1
#     for value in values:
#         product *= value
#     dp += product

# mg = 1
# for values in vectors:
#     pd = 0
#     for val in values:
#         pd += val**2
#     mg *= sqrt(pd)


# print("{:.2f}".format(dp/mg))


import numpy as np

vector1 =np.array([2,3,4])
vector2 =np.array([-3.5,1,1])

print(np.dot(vector1,vector2)/(np.linalg.norm(vector1)*np.linalg.norm(vector2)))