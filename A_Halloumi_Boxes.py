t = int(input())
for _ in range(t):
    n , k = map(int , input().split())
    arr = list(map(int , input().split()))

    sortedArr = sorted(arr)
    if arr == sortedArr:
        print("YES")
    else:
        if k <= 1:
            print("NO")
        else:
            print("YES")