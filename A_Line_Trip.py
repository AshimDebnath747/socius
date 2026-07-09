t = int(input())

for _ in range(t):
    n , x = map(int , input().split())
    nums = list(map(int , input().split()))
    diff = nums[0] - 0
    for i in range(1 , len(nums)):
        diff = max(diff , nums[i] - nums[i-1])
    diff = max(diff , 2 * (x - nums[-1]))
    print(diff)