#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

using namespace std;

struct Step {
    int i;
    int j;
    int value;
};

struct Point {
    int i;
    int j;
};

string escapeJson(const string& s) {
    string out;
    for (char ch : s) {
        if (ch == '\\' || ch == '\"') {
            out.push_back('\\');
        }
        out.push_back(ch);
    }
    return out;
}

int main() {
    std::string s1;
    std::string s2;

    if (!getline(cin, s1)) {
        return 1;
    }
    if (!getline(cin, s2)) {
        return 1;
    }

    const int n = static_cast<int>(s1.size());
    const int m = static_cast<int>(s2.size());

    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    vector<Step> steps;

    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= m; ++j) {
            if (s1[i - 1] == s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
            steps.push_back({i, j, dp[i][j]});
        }
    }

    vector<Point> path;
    string lcs;
    int i = n;
    int j = m;
    while (i > 0 && j > 0) {
        path.push_back({i, j});
        if (s1[i - 1] == s2[j - 1]) {
            lcs.push_back(s1[i - 1]);
            --i;
            --j;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            --i;
        } else {
            --j;
        }
    }

    reverse(lcs.begin(), lcs.end());

    cout << "{";
    cout << "\"lcs\":\"" << escapeJson(lcs) << "\",";
    cout << "\"length\":" << dp[n][m] << ",";

    cout << "\"table\":[";
    for (int r = 0; r <= n; ++r) {
        cout << "[";
        for (int c = 0; c <= m; ++c) {
            cout << dp[r][c];
            if (c < m) cout << ",";
        }
        cout << "]";
        if (r < n) cout << ",";
    }
    cout << "],";

    cout << "\"steps\":[";
    for (size_t idx = 0; idx < steps.size(); ++idx) {
        const Step& st = steps[idx];
        cout << "{\"i\":" << st.i << ",\"j\":" << st.j << ",\"value\":" << st.value << "}";
        if (idx + 1 < steps.size()) cout << ",";
    }
    cout << "],";

    cout << "\"path\":[";
    for (size_t idx = 0; idx < path.size(); ++idx) {
        const Point& p = path[idx];
        cout << "{\"i\":" << p.i << ",\"j\":" << p.j << "}";
        if (idx + 1 < path.size()) cout << ",";
    }
    cout << "]";
    cout << "}";

    return 0;
}
